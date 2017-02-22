using System;
using FBExtractor;
using Gtk;

public partial class MainWindow : Gtk.Window
{
	

	public MainWindow () : base (Gtk.WindowType.Toplevel)
	{
		Build ();
		FBExtractor.Program.StatusChanged += OnStatusChanged;
		FBExtractor.Program.LogEvent += OnLog;
		FBExtractor.Program.CurrentAlertChanged += OnAlertChanged;
		FBExtractor.Program.CycleChanged += OnCycleStatusChanged;
	}

	void OnLog (string msg, Alert alert = null)
	{
		lblLog.Text = $"{msg}\n{alert?.Url ()}";
	}

	void OnAlertChanged (Alert newAlert, Alert oldAlert)
	{
		tvCurrentAlert.Buffer.Text = newAlert?.ToString () ?? "";
		tvOldAllert.Buffer.Text = oldAlert?.ToString () ?? "";
	}

	protected void OnStatusChanged(bool running)
	{
		if (running)
		{
			btnStartStop.Label = "Стоп";
			lblStatusValue.LabelProp = "Предстои стартиране на цикъла";
		} else {
			btnStartStop.Label = "Старт";
			lblStatusValue.LabelProp = "Изчакване цикъла да завърши";
			btnStartStop.Sensitive = false; // disable button
		}
	}

	protected void OnCycleStatusChanged(bool cycling)
	{
		if (cycling) {
			lblStatusValue.LabelProp = "Цикълът е стартиран";
		} else {
			lblStatusValue.LabelProp = "Цикълът е спрян";
			btnStartStop.Sensitive = true; // enable button
		}
	}

	protected void OnDeleteEvent (object sender, DeleteEventArgs a)
	{
		Application.Quit ();
		a.RetVal = true;
	}

	protected void OnToggleClickEvent(object sender, EventArgs a)
	{
		//FBExtractor.Program.Running = !FBExtractor.Program.Running;
		//FBExtractor.Program.StatusChanged (FBExtractor.Program.Running);// ??

		if (FBExtractor.Program.Running) 
		{
			FBExtractor.Program.Stop ();
		} else {
			FBExtractor.Program.Start ();
		}

		//var msg = new MessageDialog (null, DialogFlags.NoSeparator, MessageType.Info, ButtonsType.None, "It worked");
		//msg.Show ();
		
	}
}
