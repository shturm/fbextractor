using OpenQA.Selenium;
using System.Text.RegularExpressions;

namespace Facegroup
{
    internal class FbGroup
    {
        public readonly string GroupName;
        public readonly string GroupUnreadText;
        public readonly string GroupUrl;

        public int CountUnread
        {
            get
            {
                if (string.IsNullOrEmpty(GroupUnreadText)) return 0;
                int result = int.Parse(Regex.Match(GroupUnreadText, @"\d+").Value);
                return result;
            }
        }

        public FbGroup(IWebElement groupEl)
        {
            GroupName = groupEl.FindElement(By.TagName("a")).Text;
            GroupUrl = groupEl.FindElement(By.LinkText(GroupName)).GetAttribute("href");
            var links = groupEl.FindElements(By.TagName("a"));
            foreach(var link in links)
            {
                if (link.Text.Contains("непрочетен"))
                {
                    GroupUnreadText = link.Text;
                    break;
                }
            }
        }

        public override string ToString()
        {
            return $"[{GroupName}]({GroupUrl})";
        }
    }
}