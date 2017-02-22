using System;
using Microsoft.Owin.Hosting;
using Owin;
using Facephone;

namespace Facephone.Web
{
	class MainClass
	{
		public static void Main (string [] args)
		{
			var facephone = new FacephoneService ();

			string uri = "http://localhost:8080";
			using (WebApp.Start<Startup> (uri)) {
				Console.WriteLine ("Started");
				Console.ReadKey ();
				Console.WriteLine ("Stopping");
			}
		}
	}

	public class Startup
	{
		public void Configuration (IAppBuilder app)
		{
			app.Run (ctx => {
				return ctx.Response.WriteAsync ("hello katana");
			});
		}
	}
}
