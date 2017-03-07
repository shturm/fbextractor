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
                int result = int.Parse(Regex.Match(GroupUnreadText, @"\d+").Value);
                return result;
            }
        }

        public FbGroup(IWebElement groupEl)
        {
            GroupName = groupEl.FindElement(By.TagName("a")).Text;
            GroupUrl = groupEl.FindElements(By.TagName("a"))[1].GetAttribute("href");
            GroupUnreadText = groupEl.FindElements(By.TagName("a"))[1].Text;
        }

        public override string ToString()
        {
            return $"[{GroupName}]({GroupUrl})";
        }
    }
}