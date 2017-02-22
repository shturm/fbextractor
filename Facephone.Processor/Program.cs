using System;
using System.Configuration;
using System.IO;

namespace Facephone.Processor
{
	class MainClass
	{
		public static void Main (string [] args)
		{
			Console.WriteLine ("Hello World!");
			if (!File.Exists (ConfigurationManager.AppSettings["DataFile"]))
			{
				File.WriteAllText (ConfigurationManager.AppSettings["Datafile"],"[]");
			}
			if (!File.Exists (ConfigurationManager.AppSettings ["QueueFile"]))
			{
				File.WriteAllText (ConfigurationManager.AppSettings ["QueueFile"], "[]");
			}

			QueueProcessor process = new QueueProcessor ();
			Console.WriteLine ("Starting...");
			process.Start ();
			process.ProcessorTask.Wait ();
			Console.WriteLine ("Stopping...");
		}
	}
}
