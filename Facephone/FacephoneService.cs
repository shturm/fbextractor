using System;
using Newtonsoft.Json;
using System.Configuration;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace Facephone
{
	public class FacephoneService
	{
		public FacephoneService ()
		{
			if (!File.Exists (ConfigurationManager.AppSettings["DataFile"]))
			{
				File.AppendAllText (ConfigurationManager.AppSettings["DataFile"], "[]");
			}

			if (!File.Exists (ConfigurationManager.AppSettings ["QueueFile"])) {
				File.AppendAllText (ConfigurationManager.AppSettings ["QueueFile"], "[]");
			}
		}

		public Phone GetOrEnque (string phone)
		{
			phone = phone.Replace (" ", "")
						 .Replace ("(", "")
						 .Replace (")", "")
						 .Replace ("+", "")
						 .Replace ("-", "");
			Phone p = GetPhone (phone);
			if (p == null) {
				Enque (phone);
			}

			return p;
		}

		void Enque (string phone)
		{
			string queueJson = File.ReadAllText (ConfigurationManager.AppSettings ["QueueFile"]);
			List<string> queue = JsonConvert.DeserializeObject<List<string>> (queueJson);
			if (queue.Contains (phone)) return;
			queue.Add (phone);
			string json = JsonConvert.SerializeObject (queue, Formatting.Indented);
			File.WriteAllText (ConfigurationManager.AppSettings["QueueFile"], json);
		}

		Phone GetPhone (string phone)
		{
			string phonesJson = File.ReadAllText (ConfigurationManager.AppSettings ["DataFile"]);
			List<Phone> phones = JsonConvert.DeserializeObject<List<Phone>>(phonesJson);
			var result = phones.Where (p => p.PhoneNumber == phone).FirstOrDefault ();
			return result;
		}
	}
}

