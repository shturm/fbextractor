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

namespace Facephone
{
	public class QueueProcessor
	{
		public Task ProcessorTask { get; private set;}
		CancellationTokenSource _tokenSource;
        bool _initiated = false;

        IWebDriver Driver;
        WebDriverWait Wait;

		public QueueProcessor ()
		{
            
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
			_tokenSource = new CancellationTokenSource ();
			ProcessorTask = Task.Run (async () => {
				while (true) {
					if (_tokenSource.Token.IsCancellationRequested) break;

                    Log($"Dequeing...");
                    string phoneNumber = StartProcessing();
                    
					if (string.IsNullOrEmpty (phoneNumber))
                    {
                        Log($"Queue is empty, continue");
                        await Task.Delay(TimeSpan.FromSeconds(5));
                        continue; // nothing to process
                    }

                    Log($"Scanning for '{phoneNumber}'");
					Phone scanned = Scan (phoneNumber);
                    Log($"Found {scanned.Links.Count} links. Saving...");
					SaveProcessedPhone (scanned);

                    Log($"Saved. Marking processed...");
                    EndProcessing(phoneNumber);
                    Log($"Marked '{phoneNumber}' processed. Waiting...");

					await Task.Delay (TimeSpan.FromSeconds (5));
                    
				}
			}, _tokenSource.Token);
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

		void SaveProcessedPhone (Phone p)
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
                        cmd.CommandText = $"insert into Phones (FacebookId, PhoneNumber) values ('{p.FacebookId}', '{p.PhoneNumber}')";
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

		Phone Scan(string phoneNumber)
		{
            var links = new List<string>()
            {
                "http://facebook.com",
                "http://google.com",
                "http://twitter.com",
                "http://myspace.com"
            };
			return new Phone (phoneNumber, $"fbid{phoneNumber}", links);
		}

        void Log (string msg, Phone phone = null)
        {
            Console.WriteLine(msg);
            File.AppendAllText(ConfigurationManager.AppSettings["LogFile"],msg+"\n");
        }
	}
}

