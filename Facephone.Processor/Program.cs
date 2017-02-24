using System;
using System.Configuration;
using System.IO;

namespace Facephone.Processor
{
	class MainClass
	{
		public static void Main (string [] args)
		{
			QueueProcessor processor = new QueueProcessor ();
            processor.Init();
			Console.WriteLine ("Starting...");
			processor.Start ();
			processor.ProcessorTask.Wait ();
			Console.WriteLine ("Stopping...");
		}
	}
}
