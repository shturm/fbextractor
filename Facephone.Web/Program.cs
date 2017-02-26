using System;
using Microsoft.Owin.Hosting;
using Owin;
using Facephone;
using Newtonsoft.Json;
using System.Threading.Tasks;
using Microsoft.Owin;
using System.IO;
using System.Linq;
using System.Configuration;

namespace Facephone.Web
{
	class MainClass
	{
		public static void Main (string [] args)
		{
			var facephone = new FacephoneService ();
            string uri = "http://localhost:8080";

            Log("FACEPHONE.WEB\n===================");
            using (WebApp.Start<Startup> (uri)) {
                Log("Started");
				Console.ReadKey ();
                Log("Stopping");
			}
		}

        static void Log(string msg, Phone phone = null)
        {
            Console.WriteLine("<Facephone.Web> " + msg);
            File.AppendAllText(ConfigurationManager.AppSettings["LogFile"], "<Facephone.Web> " + msg + "\n");
        }
    }

	public class Startup
	{
		public void Configuration (IAppBuilder app)
		{
			app.Run (ctx => {
                string phoneNumber = ctx.Request.Query["phone"];
                if (ctx.Request.Path.Value.Contains("favicon.ico"))
                {
                    ctx.Response.StatusCode = 404;
                    return ctx.Response.WriteAsync("no favicon");
                }
                if (string.IsNullOrEmpty(phoneNumber))
                {
                    Log($"Null or empty number {phoneNumber}");
                    return WriteErrorAsync(ctx, $"{phoneNumber} е невалиден номер", 400);
                }
                var service = new FacephoneService();
                try
                {
                    Phone phone = service.GetOrEnque(phoneNumber);
                    if (phone == null)
                    {
                        Log($"{phoneNumber} not found. Enqued.");
                        return WriteNotFoundAsync(ctx, phoneNumber);
                    }

                    Log($"Found {phoneNumber}, {phone.FacebookId}, {phone.Links.Count} links");
                    return WriteFoundAsync(ctx, phone);
                }
                catch (Exception ex)
                {
                    return WriteErrorAsync(ctx, ex.Message, 500);
                }
			});
            
		}

        private void Log(string msg)
        {
            Console.WriteLine("<Facephone.Web> " + msg);
            File.AppendAllText(ConfigurationManager.AppSettings["LogFile"], "<Facephone.Web> "+msg + "\n");
        }

        Task WriteErrorAsync(IOwinContext ctx, string msg, int statusCode = 500)
        {
            ctx.Response.StatusCode = statusCode;
            string template = File.ReadAllText("Error.html");
            string content = String.Format(template, msg);
            return ctx.Response.WriteAsync(content);
        }

        Task WriteNotFoundAsync(IOwinContext ctx, string phoneNumber)
        {
            ctx.Response.StatusCode = 404;
            ctx.Response.Headers.Add("Content-Type", new[] { "text/html" });
            string content = File.ReadAllText("NotFound.html")
                .Replace("PHONENUMBER", phoneNumber);
            return ctx.Response.WriteAsync(content);
        }

        Task WriteFoundAsync(IOwinContext ctx, Phone phone)
        {
            ctx.Response.StatusCode = 200;
            string liLinks = string.Join("\n",phone.Links.Select(l =>
            {
                string link = $"<li><a href='{l}'>{l}</a></li>";
                if (l.Contains("facebook.com"))
                {
                    return $"<b>{link}</b>";
                }
                return link;
            }).OrderByDescending(l => l.Contains("facebook"))
            .ToList());
            string template = File.ReadAllText("Found.html");
            string fbId = string.IsNullOrEmpty(phone.FacebookId) ? "" : $"{phone.FacebookId} - <a href='https://www.facebook.com/{phone.FacebookId}'>https://www.facebook.com/{phone.FacebookId}</a>";
            string content = String.Format(template, 
                phone.PhoneNumber,
                fbId,
                phone.HasFacebookPosts ? "Да" : "Не",
                liLinks);
            return ctx.Response.WriteAsync(content);
        }
    }
}
