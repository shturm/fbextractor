using OpenQA.Selenium;
using System.Linq;
using System.Text.RegularExpressions;

namespace Facegroup
{
    internal class FbPost
    {
        public string FbPostId;
        public string FbPostAuthor;
        public string FbPostAuthorUrl;
        public string FbPostUrl;
        public string FbPostCreated;
        public string FbFullText;
        public string FbFullHtml;

        public FbPost(IWebElement postEl)
        {
            string[] split = postEl.Text.Split('\n');
            FbPostUrl = postEl.FindElements(By.TagName("a"))
                .Where(a => a.GetAttribute("href") != null)
                .Select(a => a.GetAttribute("href"))
                .ElementAt(4);

            FbPostAuthorUrl = postEl.FindElements(By.TagName("a"))
                .Where(a => a.GetAttribute("href") != null)
                .Select(a => a.GetAttribute("href"))
                .ElementAt(2);



            FbPostId = Regex.Match(postEl.GetAttribute("id"), @"mall_post_(\d+)").Groups[1].Value;
            FbPostAuthor = NLTrim(split[0]);
            FbPostCreated = NLTrim(split[1]) ;

            // http://stackoverflow.com/questions/38714663/remove-4-byte-utf8-characters
            FbFullText = string.Concat(postEl.Text.Where(x => !char.IsSurrogate(x)));
            FbFullHtml = string.Concat(postEl.GetInnerHtml().Where(x => !char.IsSurrogate(x)));
        }

        public FbPost()
        {

        }

        public override string ToString()
        {
            string shortText = FbFullText.Substring(0, 40).Replace("\n", "");
            return NLTrim($"[#{FbPostId} {FbPostAuthor} {shortText} {FbPostUrl}]");
        }

        private string NLTrim(string str)
        {
            return str.Replace("\r", "")
                      .Replace("\n", "")
                      .Trim();
        }
    }
}