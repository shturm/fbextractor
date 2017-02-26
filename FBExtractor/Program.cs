using System;
using System.Linq;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Interactions;
using OpenQA.Selenium.Remote;
using OpenQA.Selenium.Support.UI;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Configuration;
using System.Threading.Tasks;
using System.Text;

namespace FBExtractor
{
	public class Program
	{
		static IWebDriver Driver;
		static WebDriverWait Wait;
		static WebDriverWait LongWait;

		// set from Configure() and app.config
		static string adminUsername = "";
		static string adminPassword = "";
		static string fbUsername = "";
		static string fbPassword = "";

		static SfxConfiguration Sfx;

		public static Alert CurrentAlert { get; internal set; }
		public static Alert OldAlert { get; internal set;}
		static string CurrentPostHtml { get; set;}

		public static bool Running { get; set;}
		static Task CycleTask { get; set;}

		public delegate void StatusChangedEventArgs (bool running);
		public delegate void LogEventArgs (string msg, Alert alert = null);
		public delegate void AlertChangedEventArgs (Alert newAlert, Alert oldAlert);
		public delegate void CycleStateChangedEventArgs (bool cycling);

		public static event StatusChangedEventArgs StatusChanged;
		public static event LogEventArgs LogEvent;
		public static event AlertChangedEventArgs CurrentAlertChanged;
		public static event CycleStateChangedEventArgs CycleChanged;

		public static void Init ()
		{
			var options = new ChromeOptions ();
			options.AddArgument ("--disable-notifications");
			//options.AddArgument ("--load-extension=social-fixer-for-facebook");
			options.AddExtensions ();

			Driver = new ChromeDriver ("selenium", options);
			Wait = new WebDriverWait (Driver, TimeSpan.FromSeconds (5));
			LongWait = new WebDriverWait (Driver, TimeSpan.FromSeconds (20));

			LogEvent += OnLog;
			StatusChanged += OnStatusChanged;

			Configure ();
			FacebookLogin ();
#if !DEBUG
			AdminLogin ();
#endif


			Sfx = new SfxConfiguration ("sfx.json");
			CurrentPostHtml = string.Empty;
			CurrentAlert = null;
			OldAlert = null; // 1484338468979966
			Running = false;

		}

		public static void Start ()
		{
			StatusChanged (true);
			CycleTask = Task.Run (() => { Cycle (); });

		}

		public static void Stop ()
		{
			StatusChanged (false); // should be called from Cycle when cycle is at starting point
		}

		public static void OnStatusChanged(bool running)
		{
			Running = running;
			if (!running) 
			{
				LogEvent ("Спиране на цикъла: Изчакване цикълът да завърши за да бъде безопасно спрян.");
			}
		}

		static void Cycle ()
		{
			CycleChanged (true);
			while (true) {

				CurrentPostHtml = "";
				OldAlert = CurrentAlert;
				CurrentAlert = null;
				CurrentAlertChanged (CurrentAlert, OldAlert);

				// hide previous alert
				int hideRetries = 5;
				int hideAttempt = 0;
				bool alertHidden = false;
				while (hideAttempt < hideRetries) {
					try {
						HideAlert (OldAlert);
						alertHidden = true;
						break;
					} catch (CantHideAlertException ex) {
						LogEvent ($"### ГРЕШКА Неуспешно скриване на известие. Опит #{hideAttempt+1}/{hideRetries}: {ex}",OldAlert);
					} finally {
						hideAttempt++;
					}
				}

//#if DEBUG
//				// test pausing when can't hide alert
//				alertHidden = false;
//#endif
				if (!alertHidden) {
					File.AppendAllText ("alerts-failed-to-be-hidden.txt", "\n" + OldAlert);
					StatusChanged (false);
					CycleChanged (false);
					LogEvent ($"### ГРЕШКА Неуспешно скриване на известия. Цикълът спира. Моля премахнете известието ръчно и стартирайте отново");
					break; // return;
				}

				if (!Running) 
				{
					CycleChanged (false);
					LogEvent ("Цикълът завърши и няма да стартира нов, защото е прекратен от потребителя");
					break;
				}

				// retrieve alert
				int getAlertRetries = 3;
				int getAlertAttempt = 0;
				while (getAlertAttempt < getAlertRetries) {
					try {
						OldAlert = CurrentAlert;
						CurrentAlert = GetAlert ();
						CurrentAlertChanged (CurrentAlert, OldAlert);
						break;
					} catch (Exception ex) {
						LogEvent ($"### ERROR when retrieving alert. Retry #{getAlertAttempt}: \n{ex}");
						getAlertAttempt++;
						continue;
					}
				}
				if (CurrentAlert == null) {
					int minutes = int.Parse (ConfigurationManager.AppSettings ["minutesWaitWhenNoAlerts"]);
					LogEvent ($"No alerts for processing, refreshing in {minutes} minutes");
					SleepCountdown (TimeSpan.FromMinutes (minutes));
					continue;
				}

				// read post
				int readPostRetries = 5;
				int readPostAttempt = 0;
				while (readPostAttempt < readPostRetries) {
					try {
						CurrentPostHtml = ReadPost (CurrentAlert);
						break;
					} catch (Exception ex) {
						LogEvent ($"### ГРЕШКА прочитането на публикацията не беше завършено успешно #{readPostAttempt+1}/{readPostRetries} \n{CurrentAlert}\n{ex}");
						readPostAttempt++;
						continue;
					}
				}
				if (CurrentPostHtml == string.Empty) {
					LogEvent ($" ### ГРЕШКА Продължаване без прочит на публикацията след {readPostRetries} неуспешни опита",CurrentAlert);
					File.AppendAllText ("could-not-read-post.txt", "\n" + CurrentAlert);
					continue;
				}

#if !DEBUG
				// register post in admin panel
				int registerRetries = 5;
				int registerAttempt = 0;
				bool registerSuccess = false;
				while (registerAttempt < registerRetries)
				{
					try {
						RegisterData (CurrentAlert, CurrentPostHtml);
						registerSuccess = true;
						break;
					} catch (Exception ex) {
						LogEvent ($"### ГРЕШКА неуспешно регистриране на публикация в админ панела. Опит #{registerAttempt+1}/{registerRetries} \n{ex}");
					}
				}
				if (!registerSuccess)
				{
					LogEvent ($"### ГРЕШКА неуспешно регистриране на публикация в админ панела след {registerRetries+1} опита");
					File.AppendAllText ("not-registered-in-admin-panel.txt", "\n"+CurrentAlert);
				}
#endif
			}
		}

		#region Pages
		/// <summary>
		/// Retrieves target alert.
		/// </summary>
		/// <returns>The alert.</returns>
		static Alert GetAlert ()
		{
			LogEvent ("Търсене на известия...");
			Driver.Navigate ().GoToUrl ("https://facebook.com/notifications");
			Wait.Until (ExpectedConditions.ElementIsVisible (By.CssSelector ("ul[data-testid=see_all_list] li")));

			WaitRandom ();
			var alertElements = FindElements (By.CssSelector ("ul[data-testid=see_all_list] li"));

			KeyValuePair<Alert, IWebElement>[] alertArrayKV = alertElements
				.Select (x => new KeyValuePair<Alert, IWebElement> (Alert.FromElement (x), x))
				.OrderByDescending (x => x.Key.microtime_sent).ToArray ();


			Alert resultAlert = null;

			IWebElement element = null;
			KeyValuePair<Alert, IWebElement> alertKV = new KeyValuePair<Alert, IWebElement> (null,null);
			foreach (var kv in alertArrayKV) {
				if (kv.Value.Text.Contains ("добави ")) {
					alertKV = kv;
					break;
				}
				if (kv.Value.Text.Contains ("добавиха ")) 
				{
					alertKV = kv;
					break;
				}
				if (kv.Value.Text.Contains ("публикува в")) 
				{
					alertKV = kv;
					break;
				}
				if (kv.Value.Text.Contains ("публикуваха в")) 
				{
					alertKV = kv;
					break;
				}
				if (kv.Value.Text.Contains ("коментира ")) 
				{
					alertKV = kv;
					break;
				}
				if (kv.Value.Text.Contains ("коментираха "))
				{
					alertKV = kv;
					break;
				}
			}

			if (alertKV.Key != null) {
				resultAlert = alertKV.Key;
				Hover (alertKV.Value);
				LogEvent ($"Избрано известие {resultAlert.Url ()}", resultAlert);
			}

			WaitRandom ();
			return resultAlert;
		}



		static string ReadPost (Alert alert)
		{
			LogEvent ("Прочитане на публикация...");
			string htmlResult = string.Empty;
			//string cssSelector = ".userContentWrapper"; 
			string cssSelector = "#contentArea";

			// read post data
			Driver.Navigate ().GoToUrl (alert.Url ());

			IWebElement postElement = null;
			postElement = FindElement (By.CssSelector (cssSelector));

			htmlResult = postElement.GetInnerHtml ();
			LogEvent ($"Публикацията е прочетена: {htmlResult.Length} знака");

			//Hover (postElement); // use when original Social Fixer since icons don't show unless post is hovered
			try {
				LogEvent ("Абониране за публикация...");
				PostSubscribe (postElement);
				WaitRandom ();
				LogEvent ("Абонирането е успешно");
			} catch (Exception ex) {
				throw new CantSubscribeToPostException ("Абонирането не беше успешно", ex);
			}

			try {
				LogEvent ("Запазване на публикацията в Social Fixer...");
				Sfx.AddPost (alert.content_id);
				LogEvent ("Запазване на публикацията в Social Fixer успешно");
				WaitRandom ();
			} catch (Exception ex) {
				throw new CantMarkPostReadException($"Запазване на публикацията в Social Fixer не беше успешно", ex);
			}

			return htmlResult;
		}

		static void HideAlert (Alert alertToHide)
		{
			if (alertToHide == null) return;
			if (!Driver.Url.Contains ("/facebook.com/notifications")) {
				Driver.Navigate ().GoToUrl ("https://www.facebook.com/notifications");
			}
			WaitRandom ();

			LogEvent ($"Скриване на предходното известие...",alertToHide);

			var alertsLocator = By.CssSelector ("ul[data-testid=see_all_list] li");
			var spinnerLocator = By.CssSelector ("img[color='white']");
			IEnumerable<IWebElement> elements = null;

			try {
				Wait.Until (ExpectedConditions.ElementIsVisible (alertsLocator));
			} catch (Exception ex) {
				throw new CantHideAlertException ("Списъкът с известия не беше намерен", ex);
			}


			// wait for alerts
			int retrieveAlertsRetries = 5;
			int retrieveAlertsAttempt = 0;
			while(retrieveAlertsAttempt < retrieveAlertsRetries)
			{

				try {
					Wait.Until (ExpectedConditions.ElementIsVisible (alertsLocator));
					elements = FindElements (alertsLocator);
					int minAlertsToProceed = 6;
					if (elements.Count () < minAlertsToProceed) {
						LogEvent ($"Изчакване #{retrieveAlertsAttempt+1} да се заредят още известия...");
						retrieveAlertsAttempt++;
						WaitRandom ();
						continue;
					} else {
						break;
					}
				} catch (Exception ex) {
					throw new CantHideAlertException ($"Известията не можаха да бъдат намерени по време на скриването на старо известие", ex);
				}
			}

			foreach (var element in elements) {
				Alert currentAlert = Alert.FromElement (element);
				if (currentAlert.alert_id != alertToHide.alert_id) continue;

				try {
					Hover (element);
					Hover (element);
					WaitRandom ();
					var dropdownLocator = By.CssSelector ("a[aria-label='Notification options']");
					var dropdown = element.FindElement (dropdownLocator);
					Wait.Until (ExpectedConditions.ElementToBeClickable (dropdown));
					dropdown.Click ();

				} catch (Exception ex) {
					throw new CantHideAlertException ("Не беше намерено контекстното меню", ex);
				}

				try {
					var menuItemSelector = By.CssSelector ("a[role='menuitem']");
					Wait.Until (ExpectedConditions.ElementExists (menuItemSelector));
					Wait.Until (ExpectedConditions.ElementToBeClickable (menuItemSelector));
					var menuItem = FindElement (menuItemSelector); // first one

					WaitRandom ();
					Hover (menuItem);
					WaitRandom ();
					menuItem.Click ();

				} catch (Exception ex) {
					throw new CantHideAlertException ("", ex);
				}
				return;
			}

			throw new CantHideAlertException ($"Известието за скриване не беше намерено сред общо {elements.Count ()} други известия");
		}

		static void RegisterData (Alert alert, string html)
		{
			LogEvent ("Записване на данни в админ панела", alert);

			Driver.Navigate ().GoToUrl ("https://quick.tuxbg.net/?action=ExtContent12");
			Wait.Until(ExpectedConditions.ElementIsVisible (By.TagName ("iframe")));
			Driver.SwitchTo ().Frame (0);
			FindElement (By.LinkText ("Добави известие")).Click ();

			// fill in meta data
			FindElement (By.Id ("Import_url")).SendKeys (alert.Url ());
			FindElement (By.Id ("Import_id_post")).SendKeys (alert.content_id);
			FindElement (By.Id ("Import_contact_info")).SendKeys (alert.author);

			// fill in post data
			FindElement (By.CssSelector ("a[title='Код']")).Click ();
			FindElement (By.ClassName ("cke_source")).SetAttribute("value", html);

			FindElement (By.CssSelector ("input[type='submit']")).Click ();
			Wait.Until (ExpectedConditions.ElementIsVisible (By.Id ("massiveOperation")));
			WaitRandom ();
		}

		public static void FacebookLogin ()
		{
			LogEvent ("Влизане във Фейсбук...");
			Driver.Navigate ().GoToUrl ("https://facebook.com");
			Wait.Until (ExpectedConditions.ElementIsVisible (By.Name ("email")));

			var elUser = FindElement (By.Name ("email"));
			var elPass = FindElement (By.Name ("pass"));
			elUser.SendKeys (ConfigurationManager.AppSettings["facebook-username"]);
			elPass.SendKeys (ConfigurationManager.AppSettings["facebook-password"]);
			elPass.SendKeys (Keys.Return);

			WaitRandom ();
			LogEvent ("Влизането във Фейсбук е успешно");
		}

		static void AdminLogin()
		{
			LogEvent ("Влизане във админ панела...");
			Driver.Navigate ().GoToUrl ("https://quick.tuxbg.net/?action=login");
			Wait.Until (ExpectedConditions.ElementIsVisible (By.Id ("username")));

			var elUser = FindElement (By.Id ("username"));
			var elPass = FindElement (By.Id ("userpass"));
			elUser.SendKeys (adminUsername);
			elPass.SendKeys (adminPassword);
			elPass.SendKeys (Keys.Return);

			Wait.Until (ExpectedConditions.ElementIsVisible (By.ClassName ("header")));
			LogEvent ("Влизането във админ панела е успешно");
		}

		#endregion

		#region Utilities
		public static void OnLog (string msg, Alert alert = null)
		{
			Console.WriteLine (msg);
			lock (Driver) {
				File.AppendAllText ("log.txt", msg+$" {alert} \n");
			}
		}

		static void Configure ()
		{
			fbUsername = ConfigurationManager.AppSettings ["facebook-username"];
			fbPassword = ConfigurationManager.AppSettings ["facebook-password"];
			adminUsername = ConfigurationManager.AppSettings ["admin-username"];
			adminPassword = ConfigurationManager.AppSettings ["admin-password"];
		}

		static void SleepCountdown(TimeSpan ts)
		{
			Console.WriteLine ();
			while(ts.TotalSeconds > 0)
			{
				Console.Write ($"\r{ts.ToString ()}");
				Thread.Sleep (1000);
				ts = ts.Subtract (TimeSpan.FromSeconds (1));
			}
			Console.Write ("\r");
		}
		#endregion

		#region Actions


		static void PostSubscribe (IWebElement element)
		{
			string dropdownSelector = "a[aria-label=\"Опции за историята\"";
			string menuItemsSelector = ".__MenuItem[role='presentation']";
			string messageCloseSelector = "button[title='Премахване']";

			// Hover (element); // no need to hover, it is already visible. in fact, hover puts fixed top menu over the dropdown button

			var dropdown = element.FindElement (By.CssSelector (dropdownSelector));
			WaitRandom ();
			//Hover (dropdown); // no need to hover, it is already visible. in fact, hover puts fixed top menu over the dropdown button
			//((IJavaScriptExecutor)Driver).ExecuteScript ("window.scrollTo(0, 0)");
			//WaitRandom ();
			dropdown.Click ();
			WaitRandom ();

			var menuItems = FindElements (By.CssSelector (menuItemsSelector));
			WaitRandom ();
			var subscribeMenuItem = menuItems.ElementAt (1);
			if(!subscribeMenuItem.GetInnerText ().Contains ("Включване"))
			{
				// already subscribed, don't want to unsubscribe
				return;
			}
			Hover (subscribeMenuItem);
			WaitRandom ();
			subscribeMenuItem.Click ();
				Wait.Until (ExpectedConditions.ElementIsVisible (By.CssSelector (messageCloseSelector)));
			WaitRandom ();
		}

		[Obsolete]
		static void PostMarkReadChromeExtension ()
		{
			IWebElement markReadButton = FindElement (By.CssSelector ("#sfx_post_action_tray div.mark-read-tick"));
			var remoteMarkReadButton = (RemoteWebElement)markReadButton;
			var jsExecutor = (IJavaScriptExecutor)remoteMarkReadButton.WrappedDriver;
			jsExecutor.ExecuteScript ("var ev = document.createEvent('Events');ev.initEvent('click', true, false);document.querySelector('#sfx_post_action_tray div.mark-read-tick').dispatchEvent(ev)");
		}

		#endregion

		#region Selenium Helpers

		static void WaitRandom()
		{
			var r = new Random ((int)DateTime.Now.Ticks);
			int seconds = r.Next (1,4);
			Thread.Sleep (seconds*1000);
		}

		static void Hover (IWebElement element)
		{
			Actions action = new Actions (Driver);
			action.MoveToElement (element).Perform ();
		}

		static void ClickAnyway (IWebElement element)
		{
			Actions actions = new Actions (Driver);
			actions
				//.MoveToElement (element, width, height)
			       .Click ()
			       .Perform ();
		}

		static IWebElement FindElement(By locator)
		{
			try {
				Wait.Until (ExpectedConditions.ElementIsVisible (locator));
			} catch (WebDriverTimeoutException ex)
			{
				throw new WebDriverTimeoutException ("locator: " + locator, ex);
			}
			var result = Driver.FindElement (locator);
			return result;
		}

		static IEnumerable<IWebElement> FindElements (By locator)
		{
			try {
				Wait.Until (ExpectedConditions.ElementIsVisible (locator));
			} catch (WebDriverTimeoutException ex) {
				throw new WebDriverTimeoutException ("locator: " + locator, ex);
			}
			var result = Driver.FindElements (locator);
			return result;
		}

		#endregion

		public static void CloseDriver()
		{
			Driver.Close ();
		}
	}


}
