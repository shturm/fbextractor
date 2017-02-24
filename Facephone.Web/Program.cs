using System;
using Microsoft.Owin.Hosting;
using Owin;
using Facephone;
using Newtonsoft.Json;

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
                string phoneNumber = ctx.Request.Query["phone"];
                if (string.IsNullOrEmpty(phoneNumber))
                {
                    ctx.Response.StatusCode = 400;
                    return ctx.Response.WriteAsync($"{phoneNumber} is invalid");
                }
                var service = new FacephoneService();
                try
                {
                    Phone phone = service.GetOrEnque(phoneNumber);
                    if (phone == null)
                    {
                        return ctx.Response.WriteAsync($"{phoneNumber} could not be found. It has been enqued");
                    }

                    var json = JsonConvert.SerializeObject(phone);
				    return ctx.Response.WriteAsync (json);
                }
                catch (Exception ex)
                {
                    return ctx.Response.WriteAsync($"Error: {ex.Message}");
                }
			});
            
		}
	}
}
