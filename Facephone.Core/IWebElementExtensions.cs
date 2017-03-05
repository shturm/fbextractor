using System;
using System.Collections.Generic;
using OpenQA.Selenium;
using OpenQA.Selenium.Remote;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Facephone.Core
{
	public static class IWebElementExtensions
	{
		public static string GetInnerHtml (this IWebElement element)
		{
			var remoteElement = (RemoteWebElement)element;
			var javaScriptExecutor = (IJavaScriptExecutor)remoteElement.WrappedDriver;
			var result = javaScriptExecutor.ExecuteScript ("return arguments[0].innerHTML;", element).ToString ();

			return result;
		}

		public static void SetInnerHtml (this IWebElement element, string html)
		{
			var remoteElement = (RemoteWebElement)element;
			var javaScriptExecutor = (IJavaScriptExecutor)remoteElement.WrappedDriver;
			javaScriptExecutor.ExecuteScript ("arguments[0].innerHTML = arguments[1];", element, html);
		}

		public static void SetAttribute (this IWebElement element, string attr, string val)
		{
			var remoteElement = (RemoteWebElement)element;
			var javaScriptExecutor = (IJavaScriptExecutor)remoteElement.WrappedDriver;
			javaScriptExecutor.ExecuteScript ($"arguments[0].{attr} = arguments[1];", element, val);
		}

		public static string GetInnerText (this IWebElement element)
		{
			var remoteElement = (RemoteWebElement)element;
			var javaScriptExecutor = (IJavaScriptExecutor)remoteElement.WrappedDriver;
			var result = javaScriptExecutor.ExecuteScript ("return arguments[0].innerText;", element).ToString ();

			return result;
		}

		public static long GetAlertMicrotimeSent (this IWebElement element)
		{
			 var jsonObj = JObject.Parse(element.GetAttribute ("data-gt"));
			long microtime_sent = jsonObj.SelectToken ("microtime_sent").Value<long> ();
			return microtime_sent;
		}
	}
}