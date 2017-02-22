using System;
using System.Configuration;
using System.Collections.Generic;
using System.Threading.Tasks;
using Newtonsoft.Json;
using System.IO;
using System.Linq;
using System.Threading;

namespace Facephone
{
	public class QueueProcessor
	{
		CancellationTokenSource _tokenSource;
		public Task ProcessorTask { get; private set;}

		public QueueProcessor ()
		{
			// init webdriver and facebook
		}

		public void Start()
		{
			if (ProcessorTask != null)
			{
				if (ProcessorTask.IsCompleted) throw new MethodAccessException("QueueProcessor already started");
			}
			_tokenSource = new CancellationTokenSource ();
			ProcessorTask = Task.Run (() => {
				while (true) {
					if (_tokenSource.Token.IsCancellationRequested) break;

					string queueJson = File.ReadAllText (ConfigurationManager.AppSettings ["QueueFile"]);
					List<string> queue = JsonConvert.DeserializeObject<List<string>> (queueJson);

					string current = queue.FirstOrDefault ();
					if (string.IsNullOrEmpty (current)) continue;

					Phone scanned = Scan (current);
					SavePhone (scanned);
					queue.Remove (current);
					var newQueueJson = JsonConvert.SerializeObject (queue);
					File.WriteAllText (ConfigurationManager.AppSettings["QueueFile"], newQueueJson);

					Task.Delay (TimeSpan.FromSeconds (5));
				}
			}, _tokenSource.Token);
		}

		void SavePhone (Phone p)
		{
			string phonesJson = File.ReadAllText (ConfigurationManager.AppSettings ["DataFile"]);
			List<Phone> phones = JsonConvert.DeserializeObject<List<Phone>> (phonesJson);
			if (phones.Any (x => x.PhoneNumber == p.PhoneNumber)) return;
			phones.Add (p);
			string json = JsonConvert.SerializeObject (phones, Formatting.Indented);
			File.WriteAllText (ConfigurationManager.AppSettings ["DataFile"], json);
		}

		Phone Scan(string phone)
		{
			return new Phone (phone, $"fbid{phone}", new List<string>());
			// TODO
		}
	}
}

