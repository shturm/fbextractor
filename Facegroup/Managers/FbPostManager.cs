using Facegroup;
using MySql.Data.MySqlClient;
using NLog;
using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Facegroup
{
    class FbPostManager
    {
        private static ILogger _logger = LogManager.GetCurrentClassLogger();
        private readonly IWebDriver _driver;
        private readonly SfxConfiguration _sfx;

        public FbPostManager(IWebDriver driver, SfxConfiguration sfx)
        {
            _driver = driver;
            _sfx = sfx;
        }

        public void ProcessPostElement(IWebElement postEl)
        {
            var fbPost = new FbPost(postEl);
            if (_sfx.PostExists(fbPost.FbPostId))
            {
                _logger.Debug($"Постът вече съществува: {fbPost.ToString()}");
                return;
            }

            _driver.Hover(postEl);
            _sfx.AddPost(fbPost.FbPostId);
            try
            {
                SubscribeToPost(postEl);
            }
            catch (Exception ex)
            {
                _logger.Error(ex, $"Неуспешно абониране за пост: {fbPost.ToString()}");
            }
            try
            {
#if DEBUG
#else
                AdminCreatePostDb(fbPost);
#endif
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("Duplicate"))
                {
                    _logger.Debug($"Постът вече съществува в базата данни");
                }
                else
                {
                    _logger.Error(ex, $"Неуспешно записване в базата данни: {fbPost.ToString()}");
                }
            }
            try
            {
                AdminCreatePost(fbPost);
            }
            catch (Exception ex)
            {
                _logger.Error(ex, $"Неуспешно създаване на пост в админ системата: {fbPost.ToString()}");
            }
        }

        private void SubscribeToPost(IWebElement element)
        {
            string dropdownSelector = "a[aria-label=\"Опции за историята\"";
            string menuItemsSelector = ".__MenuItem[role='presentation']";
            string messageCloseSelector = "button[title='Премахване']";
            var humanizer = new Humanizer.Humanizer(_driver);
            var wait = new WebDriverWait(_driver, TimeSpan.FromSeconds(double.Parse(ConfigurationManager.AppSettings["Facebook.TimeoutSeconds"])));

            if (_driver.FindElements(By.CssSelector("[role = 'banner']")).Count > 0)
            {
                ((IJavaScriptExecutor)_driver).ExecuteScript("document.querySelectorAll(\"[role = 'banner']\")[0].remove()");
            }

            var dropdown = element.FindElement(By.CssSelector(dropdownSelector));
            dropdown.Click();
            // necessary to wait since because next func is very slow
            if (humanizer.Enabled)
                humanizer.WaitRandom();
            else
                Thread.Sleep(1000);

            // wait for menu items to show up
            wait.Until<bool>((d) => {
                var mItems = d.FindElements(By.CssSelector(menuItemsSelector));
                var mItemsRelevant = mItems.Where(mi => {
                    if (!mi.Enabled) return false;
                    if (mi.Text.Contains("Включване на известия за тази публикация") ||
                        mi.Text.Contains("Изключване на известията за тази публикация"))
                    {
                        return true;
                    }
                    return false;
                }).ToList();

                return mItemsRelevant.Count > 0;
            });

            var menuItems = _driver.FindElements(By.CssSelector(menuItemsSelector));
            var subscribeMenuItem = menuItems.Where(mi => {
                if (!mi.Enabled) return false;
                if (mi.Text.Contains("Включване на известия за тази публикация") ||
                    mi.Text.Contains("Изключване на известията за тази публикация"))
                {
                    return true;
                }
                return false;
            }).First();
            if (!subscribeMenuItem.GetInnerText().Contains("Включване"))
            {
                // already subscribed, don't want to unsubscribe
                return;
            }
            _driver.Hover(subscribeMenuItem);
            humanizer.WaitRandom();
            subscribeMenuItem.Click();
            if (humanizer.Enabled)
                humanizer.WaitRandom();
            else
                Thread.Sleep(1000);
        }

        private void AdminCreatePostDb(FbPost post)
        {
            if (ConfigurationManager.AppSettings["Admin.Power"].ToUpper() != "ON") return;
            if (ConfigurationManager.AppSettings["Admin.ModeWebOrSql"].ToUpper() != "SQL") return;

            var con = new MySqlConnection(ConfigurationManager.AppSettings["Admin.ConnectionString"]);
            try
            {
                con.Open();

                string PostTable = ConfigurationManager.AppSettings["Admin.PostTable"];
                string PostIdCol = ConfigurationManager.AppSettings["Admin.PostIdCol"];
                string PostAuthorCol = ConfigurationManager.AppSettings["Admin.PostAuthorCol"];
                string PostUrlCol = ConfigurationManager.AppSettings["Admin.PostUrlCol"];
                string PostFullHtmlCol = ConfigurationManager.AppSettings["Admin.PostFullHtmlCol"];
                using (var t = con.BeginTransaction())
                {
                    using (var cmd = con.CreateCommand())
                    {
                        cmd.CommandText = $"INSERT INTO {PostTable} ({PostIdCol}, {PostAuthorCol}, {PostUrlCol}, {PostFullHtmlCol}) VALUES ('{post.FbPostId}', '{post.FbPostAuthor}', '{post.FbPostUrl}', '{post.FbFullHtml.Replace("'","''")}')";
                        _logger.Trace(cmd.CommandText);
                        cmd.ExecuteNonQuery();
                    }
                    t.Commit();
                }
            }
            finally
            {
                con.Dispose();
            }
        }

        private void AdminCreatePost(FbPost fbPost)
        {
            if (ConfigurationManager.AppSettings["Admin.Power"].ToUpper() != "ON") return;
            if (ConfigurationManager.AppSettings["Admin.ModeWebOrSql"].ToUpper() != "WEB") return;

            if (ConfigurationManager.AppSettings["Admin.Power"].ToUpper() != "ON") return;

            var humanizer = new Humanizer.Humanizer(_driver);
            var wait = new WebDriverWait(_driver, TimeSpan.FromSeconds(double.Parse(ConfigurationManager.AppSettings["Admin.TimeoutSeconds"])));
            _logger.Info($"Записване на пост админ панела: {fbPost.ToString()}");

            _driver.Navigate().GoToUrl(ConfigurationManager.AppSettings["Admin.CreatePostUrl"]);
            wait.Until(ExpectedConditions.ElementIsVisible(By.TagName("iframe")));
            _driver.SwitchTo().Frame(0);
            _driver.FindElement(By.LinkText("Добави известие")).Click();

            wait.Until(ExpectedConditions.ElementIsVisible(By.Id("Import_url")));

            // fill in meta data
            _driver.FindElement(By.Id("Import_url")).SendKeys(fbPost.FbPostUrl);
            _driver.FindElement(By.Id("Import_id_post")).SendKeys(fbPost.FbPostId);
            _driver.FindElement(By.Id("Import_contact_info")).SendKeys(fbPost.FbPostAuthor);

            // fill in post data
            _driver.FindElement(By.CssSelector("a[title='Код']")).Click();
            wait.Until(ExpectedConditions.ElementIsVisible(By.CssSelector("a[title='Код']")));
            _driver.FindElement(By.ClassName("cke_source")).SetAttribute("value", fbPost.FbFullHtml);

            _driver.FindElement(By.CssSelector("input[type='submit']")).Click();
            wait.Until(ExpectedConditions.ElementIsVisible(By.Id("massiveOperation")));
            humanizer.WaitRandom();
        }
    }
}