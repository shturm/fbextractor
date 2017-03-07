using System;
using System.Threading.Tasks;
using Gtk;

namespace FBExtractorGUI
{
	class MainClass
	{
		public static void Main (string [] args)
		{
			Application.Init ();
			MainWindow win = new MainWindow ();
			FBExtractor.FBExtractorMain.Init ();
			win.Show ();

			Application.Run ();
			FBExtractor.FBExtractorMain.CloseDriver ();
		}
	}
}
