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

namespace Facephone
{
    public class QueueProcessor : IDisposable
    {
        public Task ProcessorTask { get; private set; }
        public readonly List<string> BannedDomains;

        CancellationTokenSource _tokenSource;
        bool _initiated = false;

        IWebDriver Driver;
        WebDriverWait Wait;

        public QueueProcessor()
        {
            BannedDomains = GetBannedDomains();
        }

        

        public void Init()
        {
            _initiated = true;

            var options = new ChromeOptions();
            options.AddArgument("--disable-notifications");
            Driver = new ChromeDriver("selenium", options);
            Wait = new WebDriverWait(Driver, TimeSpan.FromSeconds(5));

            // facebook login
            Log("Влизане във Фейсбук...");
            Driver.Navigate().GoToUrl("https://facebook.com");
            Wait.Until(ExpectedConditions.ElementIsVisible(By.Name("email")));

            var elUser = Driver.FindElement(By.Name("email"));
            var elPass = Driver.FindElement(By.Name("pass"));
            elUser.SendKeys(ConfigurationManager.AppSettings["facebook-username"]);
            elPass.SendKeys(ConfigurationManager.AppSettings["facebook-password"]);
            elPass.SendKeys(Keys.Return);

            Log("Влизането във Фейсбук е успешно");
        }

        public void Start()
        {
            if (!_initiated)
            {
                if (ProcessorTask.IsCompleted) throw new MethodAccessException("QueueProcessor not initiated");
            }
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

                    Log($"Dequeing...");
                    string phoneNumber = StartProcessing();

                    if (string.IsNullOrEmpty(phoneNumber))
                    {
                        Log($"Queue is empty, continue");
                        await Task.Delay(TimeSpan.FromSeconds(5));
                        continue; // nothing to process
                    }

                    Log($"Scanning for '{phoneNumber}'");
                    var fbResult = ScanFacebook(phoneNumber);
                    var links = new List<string>();

                    var googlePhones = Breakdown(phoneNumber);
                    foreach (string gglPhone in googlePhones)
                    {
                        List<string> gglLinks = GoogleScan(gglPhone);
                        links.AddRange(gglLinks);
                    }

                    if (!string.IsNullOrEmpty(fbResult.FacebookId)) links.Add($"https://www.facebook.com/{fbResult.FacebookId}");
                    var scanned = new Phone(phoneNumber, fbResult.FacebookId, fbResult.HasPosts, links);

                    Log($"Found {scanned.Links.Count} links. Saving...");
                    SaveProcessedPhone(scanned);

                    Log($"Saved. Marking processed...");
                    EndProcessing(phoneNumber);
                    Log($"Marked '{phoneNumber}' processed. Waiting...");

                    await Task.Delay(TimeSpan.FromSeconds(5));

                }
            }, _tokenSource.Token);
        }

        private List<string> GoogleScan(string gglPhone)
        {
            var result = new List<string>();
            Driver.Navigate().GoToUrl($"https://google.com?#safe=off&q={gglPhone}");
            Wait.Until(ExpectedConditions.ElementIsVisible(By.ClassName("g")));
            var gglResults = Driver.FindElements(By.ClassName("g"));

            List<string> variations = Variations(gglPhone.Replace(" ", ""));

            foreach (var gglItem in gglResults)
            {
                string url = gglItem.FindElement(By.TagName("a")).GetAttribute("href");
                // always add facebook
                if (url.Contains("facebook.com"))
                {
                    result.Add(url);
                    continue;
                }
                if (BannedDomains.Any(d=>url.Contains(d)))
                {
                    continue;
                }

                foreach (var v in variations)
                {
                    if (gglItem.Text.Contains(v))
                    {
                        result.Add(url);
                    }
                }
            }

            return result;
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
                        string values = string.Join(",", p.Links.Select(link => $"({phoneId}, '{link}')").ToList()) ?? null;
                        if (!string.IsNullOrEmpty(values))
                        {
                            cmd3.CommandText = $"insert into Links (PhoneId, Url) values {values}";
                            cmd3.ExecuteNonQuery();
                        }
                    }

                    tr.Commit();
                }

                con.Close();
            }
        }

        FacebookScanResult ScanFacebook(string phoneNumber)
        {
            Driver.Navigate().GoToUrl($"https://facebook.com/search/top/?q={phoneNumber}");
            Wait.Until(ExpectedConditions.ElementIsVisible(By.Id("contentArea")));
            var content = Driver.FindElement(By.Id("contentArea"));

            if (content.Text.Contains("Не успяхме да намерим нищо"))
            {
                return new FacebookScanResult(null, false);
            }

            if (content.Text.StartsWith("Обществени публикации"))
            {
                return new FacebookScanResult(null, true);
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

            return new FacebookScanResult(facebookId);
        }

        void Log(string msg, Phone phone = null)
        {
            Console.WriteLine(msg);
            File.AppendAllText(ConfigurationManager.AppSettings["LogFile"], msg + "\n");
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
            Driver.Close();
        }
    }
}

