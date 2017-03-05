using Facephone.Core;
using NLog;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using System;
using System.Configuration;
using System.IO;

namespace Facephone.Processor
{
	class MainClass
	{
		public static void Main (string [] args)
		{
            var logger = LogManager.GetCurrentClassLogger();
            logger.Info("FACEPHONE.PROCESSOR================================");
            var driver = CreateDriver();
            var humanizer = new Humanizer.Humanizer(driver, logger);
            var processor = new QueueProcessor (logger, driver, humanizer);
            
            logger.Info("Starting...");
			processor.Start ();
			processor.ProcessorTask.Wait ();
            logger.Info("Stopping...");
		}

        static IWebDriver CreateDriver()
        {
            var options = new ChromeOptions();
            options.AddArgument("--disable-notifications");
            var driver = new ChromeDriver("selenium", options);
            return driver;
        }
    }
}
