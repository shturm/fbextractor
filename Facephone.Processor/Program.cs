using System;
using System.Configuration;
using System.IO;

namespace Facephone.Processor
{
	class MainClass
	{
		public static void Main (string [] args)
		{
            Log("FACEPHONE.PROCESSOR\n===================");
			QueueProcessor processor = new QueueProcessor ();
            processor.Init();
            Log("Starting...");
			processor.Start ();
			processor.ProcessorTask.Wait ();
            Log("Stopping...");
		}

        static void Log(string msg, Phone phone = null)
        {
            Console.WriteLine("<Facephone.Processor> " + msg);
            File.AppendAllText(ConfigurationManager.AppSettings["LogFile"], "<Facephone.Processor> " + msg + "\n");
        }
    }
}
