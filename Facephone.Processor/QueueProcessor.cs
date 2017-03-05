using System;
using System.Configuration;
using System.Collections.Generic;
using System.Threading.Tasks;
using Newtonsoft.Json;
using System.IO;
using System.Linq;
using System.Threading;
using System.Data.SQLite;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;
using OpenQA.Selenium.Interactions;
using System.Text.RegularExpressions;
using Facephone.Processor;
using Facephone.Core;
using NLog;
using Humanizer;

namespace Facephone
{
    public class QueueProcessor : IDisposable
    {
        public Task ProcessorTask { get; private set; }
        public readonly List<string> BannedDomains;

        CancellationTokenSource _tokenSource;
        bool _initiated = false;
        private readonly ILogger _logger;
        private readonly Humanizer.Humanizer _humanizer;
        private readonly IWebDriver _driver;

        private readonly WebDriverWait Wait;


        public QueueProcessor(ILogger logger, IWebDriver driver, Humanizer.Humanizer humanizer)
        {
            _logger = logger;
            _driver = driver;
            _humanizer = humanizer;
            Wait = new WebDriverWait(_driver, TimeSpan.FromSeconds(double.Parse(ConfigurationManager.AppSettings["MaxSecondsPageLoad"])));
            BannedDomains = GetBannedDomains();

            FacebookLogin();
        }

        private void FacebookLogin()
        {
            Log("Влизане във Фейсбук...");
            _driver.Navigate().GoToUrl("https://facebook.com");
            Wait.Until(ExpectedConditions.ElementIsVisible(By.Name("email")));

            var elUser = _driver.FindElement(By.Name("email"));
            var elPass = _driver.FindElement(By.Name("pass"));
            elUser.SendKeys(ConfigurationManager.AppSettings["facebook-username"]);
            elPass.SendKeys(ConfigurationManager.AppSettings["facebook-password"]);
            elPass.SendKeys(Keys.Return);

            Log("Влизането във Фейсбук е успешно");
        }

        public void Start()
        {
            if (ProcessorTask != null)
            {
                if (ProcessorTask.IsCompleted) throw new MethodAccessException("QueueProcessor already started");
            }
            _tokenSource = new CancellationTokenSource();
            ProcessorTask = Task.Run(async () =>
            {
                while (true)
                {
                    if (_tokenSource.Token.IsCancellationRequested) break;

                    string phoneNumber = StartProcessing();

                    if (string.IsNullOrEmpty(phoneNumber))
                    {
                        await Task.Delay(TimeSpan.FromSeconds(5));
                        continue; // nothing to process
                    }

                    Log($"Processing '{phoneNumber}'");
                    var linksAndHtml = new Dictionary<string, string>();
                    var fbResult = ScanFacebook(phoneNumber);

                    var googlePhones = Breakdown(phoneNumber);
                    foreach (string gglPhone in googlePhones)
                    {
                        Dictionary<string, string> gglLinks = ScanGoogle(gglPhone);
                        foreach (KeyValuePair<string,string> gglLinkKv in gglLinks)
                        {
                            if (linksAndHtml.ContainsKey(gglLinkKv.Key)) continue;
                            linksAndHtml.Add(gglLinkKv.Key, gglLinkKv.Value);
                        }
                    }

                    if (!string.IsNullOrEmpty(fbResult.FacebookId)) linksAndHtml.Add($"https://www.facebook.com/{fbResult.FacebookId}", fbResult.Html);
                    if (fbResult.HasPosts) linksAndHtml.Add($"https://www.facebook.com/search/top/?q={phoneNumber}", fbResult.Html);
                    var scanned = new Phone(phoneNumber, fbResult.FacebookId, fbResult.HasPosts, linksAndHtml);

                    Log($"Processed {phoneNumber} - {scanned.FacebookId} {scanned.LinksAndHtml.Count} links");
                    SaveProcessedPhone(scanned);

                    EndProcessing(phoneNumber);

                    await Task.Delay(TimeSpan.FromSeconds(5));

                }
            }, _tokenSource.Token);
        }

        private List<string> Variations(string phoneNumber)
        {
            List<string> result = new List<string>();
            List<string> brokendown = Breakdown(phoneNumber);
            foreach (var b in brokendown)
            {
                if (b.Contains(" "))
                {
                    string variation = b.Replace(" ", "-");
                    result.Add(variation);
                    result.Add(b);
                }
                else
                {
                    result.Add(b);
                }
            }

            return result;
        }

        static void EndProcessing(string phoneNumber)
        {
            string cs = ConfigurationManager.AppSettings["ConnectionString"];
            using (SQLiteConnection con = new SQLiteConnection(cs))
            {
                con.Open();

                using (SQLiteTransaction tr = con.BeginTransaction())
                {
                    using (SQLiteCommand cmd = con.CreateCommand())
                    {

                        cmd.Transaction = tr;
                        cmd.CommandText = $"update Queue set Status = 'processed' where PhoneNumber = '{phoneNumber}'";
                        cmd.ExecuteNonQuery();
                    }

                    tr.Commit();
                }

                con.Close();
            }
        }

        static string StartProcessing()
        {
            string phoneNumber = null;

            string cs = ConfigurationManager.AppSettings["ConnectionString"];
            using (SQLiteConnection con = new SQLiteConnection(cs))
            {
                con.Open();

                using (SQLiteTransaction tr = con.BeginTransaction())
                {
                    using (SQLiteCommand cmd = con.CreateCommand())
                    {
                        cmd.Transaction = tr;
                        cmd.CommandText = "select * from Queue where Status = 'waiting' order by Id limit 1";
                        using (var reader = cmd.ExecuteReader())
                        {
                            if (reader.Read()) // single row
                            {
                                phoneNumber = reader["PhoneNumber"].ToString();
                            }
                        }
                    }

                    using (SQLiteCommand cmd2 = con.CreateCommand())
                    {
                        cmd2.Transaction = tr;
                        cmd2.CommandText = $"update Queue set Status = 'processing' where PhoneNumber = '{phoneNumber}'";
                        cmd2.ExecuteNonQuery();
                    }

                    tr.Commit();
                }

                con.Close();
            }

            return phoneNumber;
        }

        void SaveProcessedPhone(Phone p)
        {
            string cs = ConfigurationManager.AppSettings["ConnectionString"];
            using (SQLiteConnection con = new SQLiteConnection(cs))
            {
                con.Open();

                using (SQLiteTransaction tr = con.BeginTransaction())
                {
                    string phoneId = null;
                    using (SQLiteCommand cmd = con.CreateCommand())
                    {
                        cmd.Transaction = tr;
                        int hasPosts = p.HasFacebookPosts ? 1 : 0;
                        cmd.CommandText = $"insert into Phones (FacebookId, PhoneNumber, HasFacebookPosts) values ('{p.FacebookId}', '{p.PhoneNumber}', {hasPosts})";
                        cmd.ExecuteNonQuery();
                    }

                    using (SQLiteCommand cmd2 = con.CreateCommand())
                    {
                        cmd2.Transaction = tr;
                        cmd2.CommandText = $"select Id from Phones where PhoneNumber = '{p.PhoneNumber}' limit 1";
                        using (var reader = cmd2.ExecuteReader())
                        {
                            reader.Read();
                            phoneId = reader["Id"].ToString();
                        }
                    }

                    using (SQLiteCommand cmd3 = con.CreateCommand())
                    {
                        cmd3.Transaction = tr;
                        string values = string.Join(",", p.LinksAndHtml
                            .Select(kvLink => $"({phoneId}, '{kvLink.Key}', '{kvLink.Value.Replace("'","''")}')")
                            .ToList()) ?? null;
                        if (!string.IsNullOrEmpty(values))
                        {
                            cmd3.CommandText = $"insert into Links (PhoneId, Url, Html) values {values}";
                            cmd3.ExecuteNonQuery();
                        }
                    }

                    tr.Commit();
                }

                con.Close();
            }
        }

        ScanFacebookResult ScanFacebook(string phoneNumber)
        {
            _driver.Navigate().GoToUrl($"https://facebook.com/search/top/?q={phoneNumber}");
            Wait.Until(ExpectedConditions.ElementIsVisible(By.Id("contentArea")));
            var content = _driver.FindElement(By.Id("contentArea"));
            string html = content.GetInnerHtml();

            if (content.Text.Contains("Не успяхме да намерим нищо"))
            {
                _humanizer.VisitRandomLink();
                _humanizer.ScrollPage();
                return new ScanFacebookResult(null, html, false);
            }

            if (content.Text.StartsWith("Обществени публикации"))
            {
                _humanizer.StayOnPage();
                _humanizer.ScrollPage();
                _humanizer.VisitRandomLink();
                return new ScanFacebookResult(null, html, true);
            }

            string facebookId = null;
            string url = content.FindElement(By.TagName("a")).GetAttribute("href");
            if (string.IsNullOrEmpty(facebookId))
            {
                // https://www.facebook.com/profile.php?id=100015048220220&ref=br_rs
                facebookId = Regex.Match(url, @"profile.php\?id=(\d+)&", RegexOptions.IgnoreCase).Groups[1].Value;
            }
            if (string.IsNullOrEmpty(facebookId))
            {
                // https://www.facebook.com/gosho.penchev?ref=br_rs
                facebookId = Regex.Match(url, @"facebook\.com/([a-z0-9.]+)\?", RegexOptions.IgnoreCase).Groups[1].Value;
            }

            _humanizer.StayOnPage();
            _humanizer.ScrollPage();
            _humanizer.VisitRandomLink();
            return new ScanFacebookResult(facebookId, html);
        }
        /// <summary>
        /// Make a single google search for a search term
        /// </summary>
        /// <param name="gglPhone"></param>
        /// <returns>key = url, value = html</returns>
        private Dictionary<string, string> ScanGoogle(string gglPhone)
        {
            var result = new Dictionary<string, string>();
            _driver.Navigate().GoToUrl($"https://google.com?#safe=off&q={gglPhone}");
            Wait.Until(ExpectedConditions.ElementIsVisible(By.ClassName("g")));
            var gglResults = _driver.FindElements(By.ClassName("g"));

            List<string> variations = Variations(gglPhone.Replace(" ", ""));

            foreach (var gglItem in gglResults)
            {
                string url = gglItem.FindElement(By.TagName("a")).GetAttribute("href");
                string html = gglItem.FindElement(By.TagName("h3")).GetInnerHtml() + "<br/>" +
                               gglItem.FindElement(By.ClassName("st")).GetInnerHtml();
                
                // always add facebook
                if (url.Contains("facebook.com"))
                {
                    result.Add(url,html);
                    continue;
                }
                if (BannedDomains.Any(d => url.Contains(d)))
                {
                    continue;
                }

                foreach (var v in variations)
                {
                    if (gglItem.Text.Contains(v))
                    {
                        result.Add(url,html);
                    }
                }
            }

            _humanizer.StayOnPage();
            _humanizer.ScrollPage();
            _humanizer.VisitRandomLink();

            return result;
        }
        void Log(string msg, Phone phone = null)
        {
            _logger.Info(msg);
            //Console.WriteLine("<Facephone.Processor> " + msg);
            File.AppendAllText(ConfigurationManager.AppSettings["LogFile"],"<Facephone.Processor> "+ msg + "\n");
        }
        internal List<string> Breakdown(string phoneNumber)
        {
            if (phoneNumber.Length >= 11)
            {
                phoneNumber = phoneNumber.Substring(1, 10);
            }
            if (!Regex.IsMatch(phoneNumber, @"^0\d{9}$"))
            {
                throw new ArgumentException($"{phoneNumber} is not valid");
            }

            var result = new List<string>();

            string type1 = phoneNumber.Substring(0, 4);
            type1 += " ";
            type1 += phoneNumber.Substring(4, 3);
            type1 += " ";
            type1 += phoneNumber.Substring(7, 3);
            result.Add(type1);

            string type2 = phoneNumber.Substring(0, 4);
            type2 += " ";
            type2 += phoneNumber.Substring(4, 2);
            type2 += " ";
            type2 += phoneNumber.Substring(6, 2);
            type2 += " ";
            type2 += phoneNumber.Substring(8, 2);
            result.Add(type2);

            string type3 = phoneNumber.Substring(0, 3);
            type3 += " ";
            type3 += phoneNumber.Substring(3, 3);
            type3 += " ";
            type3 += phoneNumber.Substring(6, 4);
            result.Add(type3);

            result.Add(phoneNumber);

            return result;
        }
        private List<string> GetBannedDomains()
        {
            List<string> result = new List<string>();
            string cs = ConfigurationManager.AppSettings["ConnectionString"];
            using (SQLiteConnection con = new SQLiteConnection(cs))
            {
                con.Open();
                using (SQLiteTransaction tr = con.BeginTransaction())
                {
                    using (SQLiteCommand cmd = con.CreateCommand())
                    {
                        cmd.CommandText = "select Domain from BannedDomains";
                        using (var reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                result.Add(reader["Domain"].ToString());
                            }
                        }
                    }
                    tr.Commit();
                }
            }

            return result;
        }
        public void Dispose()
        {
            _driver.Close();
        }
    }
}

