using NLog;
using OpenQA.Selenium;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Humanizer
{
    public class Humanizer : IHumanizer
    {
        public bool Enabled { get { return ConfigurationManager.AppSettings["Humanizer.Power"].ToUpper() == "ON"; } }
        private static readonly ILogger _logger = LogManager.GetCurrentClassLogger();
        private readonly IWebDriver _driver;
        
        public Humanizer(IWebDriver driver)
        {
            _driver = driver;
        }

        public void StayOnPage()
        {
            if (ConfigurationManager.AppSettings["Humanizer.Power"].ToUpper() != "ON") return;

            if (!RollChance("Humanizer.StayOnPage.ChancePercent")) return;
            WaitRandom();
        }

        public void ScrollPage()
        {
            if (ConfigurationManager.AppSettings["Humanizer.Power"].ToUpper() != "ON") return;
            if (!RollChance("Humanizer.ScrollPage.ChancePercent")) return;

            var body = _driver.FindElement(By.TagName("body"));
            body.SendKeys(Keys.PageDown);

            WaitRandom();

            if (RollChance("Humanizer.ScrollPage.ChancePercentScrollBackUp"))
            {
                body.SendKeys(Keys.PageUp);
                WaitRandom();
            }
        }

        public void VisitRandomLink()
        {
            if (ConfigurationManager.AppSettings["Humanizer.Power"].ToUpper() != "ON") return;
            if (!RollChance("Humanizer.VisitRandomLink.ChancePercent")) return;

            var anchors = _driver.FindElements(By.TagName("a")).Where(a => a.Displayed);
            var anchorsWithHref = new List<IWebElement>();
            foreach (var a in anchors)
            {
                try
                {
                    if (a.GetAttribute("href").Contains("http"))
                    {
                        anchorsWithHref.Add(a);
                    }
                }
                catch (Exception ex)
                {
                    continue;
                }
            }
                
            if(anchorsWithHref.Count == 0)
            {
                _logger.Warn($"Could not visit random link, no http anchors at {_driver.Url}");
                return;
            }
            Thread.Sleep(25);
            int randomAnchorsIndex = new Random().Next(0, anchorsWithHref.Count + 1);

            if (randomAnchorsIndex <= 0 || randomAnchorsIndex >= anchorsWithHref.Count)
            {
                _logger.Warn($"randomAnchorsIndex ({randomAnchorsIndex}) out of range ({anchorsWithHref.Count})");
                return;
            }
            try
            {
                anchorsWithHref[randomAnchorsIndex].Click();
            }
            catch (Exception ex)
            {
                _logger.Error(ex, $"Could not click random link [{anchorsWithHref[randomAnchorsIndex].Text}]({anchorsWithHref[randomAnchorsIndex].GetAttribute("href")})");
            }
            WaitRandom();
        }

        public void WaitRandom()
        {
            if (ConfigurationManager.AppSettings["Humanizer.Power"].ToUpper() != "ON") return;

            Thread.Sleep(25);
            int min = int.Parse(ConfigurationManager.AppSettings["Humanizer.WaitRandom.MinSeconds"]);
            int max = int.Parse(ConfigurationManager.AppSettings["Humanizer.WaitRandom.MaxSeconds"]);
            int seconds = new Random().Next(min, max + 1);
            _logger.Trace($"WaitRandom: {seconds} seconds");
            Thread.Sleep(seconds * 1000);
        }


        private bool RollChance(string chanceConfigKey)
        {
            Thread.Sleep(25); // to allow consecutive rolls
            int chance = int.Parse(ConfigurationManager.AppSettings[chanceConfigKey]);
            int roll = new Random().Next(1, 101);
            if (chance >= roll)
            {
                _logger.Trace($"Rolled TRUE {chanceConfigKey}");
                return true;
            }
            _logger.Trace($"Rolled FALSE {chanceConfigKey}");
            return false;
        }

        
    }
}
