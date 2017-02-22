using System;
using System.Configuration;
using System.IO;

namespace Facephone.Processor
{
	class MainClass
	{
		public static void Main (string [] args)
		{
			QueueProcessor process = new QueueProcessor ();
			Console.WriteLine ("Starting...");
			process.Start ();
			process.ProcessorTask.Wait ();
			Console.WriteLine ("Stopping...");
		}
	}
}
