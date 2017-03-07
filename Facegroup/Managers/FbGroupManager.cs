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
using Humanizer;

namespace Facegroup
{
    class FbGroupManager
    {
        private static ILogger _logger = LogManager.GetCurrentClassLogger();
        private readonly IWebDriver _driver;
        private readonly Humanizer.Humanizer _humanizer;
        private readonly WebDriverWait _wait;

        public FbGroupManager(IWebDriver driver)
        {
            _driver = driver;
            _wait = new WebDriverWait(_driver, TimeSpan.FromSeconds(double.Parse(ConfigurationManager.AppSettings["Facebook.TimeoutSeconds"])));
            _humanizer = new Humanizer.Humanizer(_driver);
        }

        public IEnumerable<IWebElement> GetPosts(FbGroup fbGroup)
        {
            _driver.Navigate().GoToUrl(fbGroup.GroupUrl);
            _wait.Until(ExpectedConditions.ElementIsVisible(By.Id("pagelet_group_composer")));

            LoadConfiguredPostCount();
            _humanizer.WaitRandom();

            List<IWebElement> postsEl = FindPosts();
            return postsEl;
        }
        public IEnumerable<FbGroup> GetUnreadGroups()
        {
            _driver.Navigate().GoToUrl(@"https://www.facebook.com/groups/?category=groups");
            _wait.Until(ExpectedConditions.ElementIsVisible(By.Id("GroupDiscoverCard_membership")));

            // load all groups
            int previousCount = 0;
            var allGroups = _driver.FindElements(By.CssSelector("#GroupDiscoverCard_membership li > ul > li"));
            while (previousCount < allGroups.Count)
            {
                _driver.FindElement(By.TagName("body")).SendKeys(Keys.End);
                _humanizer.WaitRandom();
                previousCount = allGroups.Count;
                allGroups = _driver.FindElements(By.CssSelector("#GroupDiscoverCard_membership li > ul > li"));
                _logger.Trace($"previousCount = {previousCount}, allGroups.Count = {allGroups.Count}");
            }

            var unreadGroups = allGroups
                .Where(g => !g.Text.Contains("0 непрочетени публикации") || g.Text.Contains("Над 10 непрочетени публикации"))
                .Select(el => new FbGroup(el))
                .ToList();

            _logger.Info($"{unreadGroups.Count} групи с непрочетени публикации от общо {allGroups.Count}");
            return unreadGroups;

        }
        private List<IWebElement> FindPosts()
        {
            var result = _driver.FindElements(By.CssSelector("#pagelet_group_mall > div > div > div"))
               .Where(p =>
               {
                   string id = p.GetAttribute("id");
                   if (string.IsNullOrEmpty(id)) return false;
                   if (id.Contains("mall_post_")) return true;
                   return false;
               }).ToList();

            return result;
        }
        private void LoadConfiguredPostCount()
        {
            int requiredPostCount = int.Parse(ConfigurationManager.AppSettings["PostCountPerGroup"]);
            int previousPostCount = 0;
            int morePostsLoadTimeout = int.Parse(ConfigurationManager.AppSettings["Facebook.TimeoutSeconds"]);
            List<IWebElement> postsEl = FindPosts();
            while (postsEl.Count < requiredPostCount)
            {
                _driver.FindElement(By.TagName("body")).SendKeys(Keys.End);
                // wait for posts to load
                bool pageLoadSuccessful = false;
                for (int i = 0; i < morePostsLoadTimeout; i++)
                {
                    Thread.Sleep(1000);
                    previousPostCount = postsEl.Count;
                    postsEl = FindPosts();
                    if (postsEl.Count > previousPostCount)
                    {
                        pageLoadSuccessful = true;
                        break;
                    }
                }
                if (!pageLoadSuccessful)
                {
                    _logger.Warn($"Зареждане на следваща страница с постове не беше успешно");
                    break;
                }
            }
        }
    }
}
