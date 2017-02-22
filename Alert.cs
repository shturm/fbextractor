using System;
using OpenQA.Selenium;
using System.Text.RegularExpressions;
using Newtonsoft.Json;

namespace FBExtractor
{
	public class Alert
	{
		public string alert_id;
		public string context_id;
		public string content_id;
		public string notif_type;
		public long microtime_sent;

		public string text;
		public string author;

		public string OriginalUrl;

		public Alert ()
		{

		}

		public static Alert FromElement (IWebElement element)
		{
			string json = element.GetAttribute ("data-gt");
			var alert = JsonConvert.DeserializeObject<Alert> (json);
			alert.text = element.GetInnerText ().Replace ("\n"," ");
			alert.OriginalUrl = element.FindElement (By.TagName ("a")).GetAttribute ("href");
			
			int verb = 0;
			if (alert.text.Contains ("публикува")) verb = alert.text.IndexOf ("публикува");
			if (alert.text.Contains ("публикуваха")) verb = alert.text.IndexOf ("публикуваха");
			if (alert.text.Contains ("коментира")) verb = alert.text.IndexOf ("коментира");
			if (alert.text.Contains ("коментираха")) verb = alert.text.IndexOf ("коментираха");
			if (alert.text.Contains ("добави")) verb = alert.text.IndexOf ("добави");
			if (alert.text.Contains ("добавиха")) verb = alert.text.IndexOf ("добавиха");
			alert.author = alert.text.Substring (0, verb);

			return alert;
		}

		public string Url ()
		{
			string left = Regex.Match (OriginalUrl, "http.*groups/.*?/").Value;
			string linkContentId = Regex.Match (OriginalUrl, @"multi_permalinks=(\d+)").Groups [1].Value;
			string id = string.IsNullOrEmpty (linkContentId) ? content_id : linkContentId;
			return $"{left}permalink/{id}";
		}

		public override string ToString ()
		{
			string shortText = "";
			if (text != null && text.Length > 61)
			{
				shortText = text.Substring (0, 60);
			}
			return $"[alert_id: {alert_id}, " +
				$"url: {Url ()} " +
				$"author: {author}, " +
				$"text: {shortText}...]";
		}
	}
}

