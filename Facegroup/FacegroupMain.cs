using MySql.Data.MySqlClient;
using NLog;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Interactions;
using OpenQA.Selenium.Support.UI;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Facegroup
{
    public static class FacegroupMain
    {
        private static ILogger _logger = LogManager.GetCurrentClassLogger();

        public static void Main()
        {
            _logger.Info(" ============== FACEGROUP ==============");
            PrintConfiguration();

            var options = new ChromeOptions();
            options.AddArgument("--disable-notifications");
            string sfxPath = Directory.GetCurrentDirectory() + @"\social-fixer-for-facebook";
            //options.AddArgument(@"--load-extension="+sfxPath);
            options.AddExtensions();
            var driver = new ChromeDriver("selenium",options);
            var sfx = new SfxConfiguration(ConfigurationManager.AppSettings["SfxConfigurationFile"]);
            
            AdminLogin(driver);
            FacebookLogin(driver);

            var groupManager = new FbGroupManager(driver);
            var postManager = new FbPostManager(driver, sfx);

            IEnumerable<FbGroup> unreadGroups = groupManager.GetUnreadGroups();
            foreach (var fbGroup in unreadGroups)
            {
                _logger.Info($"------------------- Обработка на група: {fbGroup.ToString()} -----------------------");
                try
                {
                    IEnumerable<IWebElement> postsEl = groupManager.GetPosts(fbGroup);
                    _logger.Info($"{postsEl.Count()} поста за обработка в група {fbGroup.ToString()}");
                    foreach (var postEl in postsEl)
                    {
                        var fbPost = new FbPost(postEl);
                        _logger.Info($"Обработка на пост: {fbPost.ToString()}");
                        try
                        {
                            postManager.ProcessPostElement(postEl);
                        }
                        catch (Exception postEx)
                        {
                            _logger.Error(postEx, $"Грешка при обработка на пост: {fbPost}");
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.Error(ex, $"Грешка при обработка на група '{fbGroup.GroupName}' - {fbGroup.GroupUrl}");
                    continue;
                }
            }
        }

       

        static void AdminLogin(IWebDriver driver)
        {
            if (ConfigurationManager.AppSettings["Admin.Power"].ToUpper() != "ON") return;
            if (ConfigurationManager.AppSettings["Admin.ModeWebOrSql"].ToUpper() != "WEB") return;

            _logger.Info("Влизане във админ панела...");
            var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(double.Parse(ConfigurationManager.AppSettings["Admin.TimeoutSeconds"])));
            driver.Navigate().GoToUrl("https://quick.tuxbg.net/?action=login");
            wait.Until(ExpectedConditions.ElementIsVisible(By.Id("username")));


            var elUser = driver.FindElement(By.Id("username"));
            var elPass = driver.FindElement(By.Id("userpass"));
            elUser.SendKeys(ConfigurationManager.AppSettings["Admin.Username"]);
            elPass.SendKeys(ConfigurationManager.AppSettings["Admin.Password"]);
            elPass.SendKeys(Keys.Return);

            wait.Until(ExpectedConditions.ElementIsVisible(By.ClassName("header")));
            _logger.Info("Влизането във админ панела е успешно");
        }
        static void FacebookLogin(IWebDriver driver)
        {
            _logger.Info("Влизане във Фейсбук...");
            var humanizer = new Humanizer.Humanizer(driver);
            var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(double.Parse(ConfigurationManager.AppSettings["Facebook.TimeoutSeconds"])));
            driver.Navigate().GoToUrl("https://facebook.com");

            wait.Until(ExpectedConditions.ElementIsVisible(By.Name("email")));

            var elUser = driver.FindElement(By.Name("email"));
            var elPass = driver.FindElement(By.Name("pass"));
            elUser.SendKeys(ConfigurationManager.AppSettings["Facebook.Username"]);
            elPass.SendKeys(ConfigurationManager.AppSettings["Facebook.Password"]);
            elPass.SendKeys(Keys.Return);

            humanizer.WaitRandom();
            _logger.Info("Влизането във Фейсбук е успешно");
        }
        private static void PrintConfiguration()
        {
            foreach (var key in ConfigurationManager.AppSettings.AllKeys)
            {
                _logger.Info($"{key} = {ConfigurationManager.AppSettings[key]}");
            }
        }
    }
}
