using NUnit.Framework;
using System;
using System.Linq;
using System.IO;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Collections.Generic;

namespace Tests
{
	[TestFixture ()]
	public class Test
	{
		[Test ()]
		public void TestCase ()
		{
			string json = @"{
  ""options"": {},
  ""filters"": [],
  ""tweaks"": [],
  ""hiddens"": {},
  ""postdata"": {
    ""1234567890123456"": {
      ""read_on"": 1485065470504
    },
    ""1234567890123457"": {},
    ""1234567890123458"": {}
  },
  ""friends"": {},
  ""stats"": {
    ""sfx_news_checked_on"": 1485065372244,
    ""installed_on"": 1485065480981
  },
  ""tasks"": {
    ""clean_postdata_cache"": {
      ""run_on"": 1485065368662
    },
    ""news_alerts"": {
      ""run_on"": 1485065421573
    },
    ""update_filter_subscriptions"": {
      ""run_on"": 1485065368666
    },
    ""update_tweak_subscriptions"": {
      ""run_on"": 1485065368666
    }
  },
  ""messages"": {},
  ""storage_check"": {
    ""storage_checked_on"": 1485065421577
  }
}";
			var obj = JObject.Parse (json);
			//Console.WriteLine (obj.Property ("postdata").Value);
			//Console.WriteLine (obj.GetValue ("postdata"));

			JObject postdata = obj ["postdata"] as JObject;
			postdata.Add ("1234", JToken.FromObject (new { }));

			//Console.WriteLine (postdata);
			Console.WriteLine (obj);
		}

		[Test]
		public void Timestamp ()
		{
			var diff= DateTime.UtcNow.Subtract (new DateTime (1970, 1, 1)).TotalSeconds*10;
			var unixTimestamp = Math.Floor (diff);
			Console.WriteLine (unixTimestamp);

			Console.WriteLine ((long)DateTime.UtcNow.Subtract (new DateTime (1970, 1, 1, 0,0,0)).TotalSeconds*1000);
			//Console.WriteLine (DateTime.UtcNow.Subtract (new DateTime (1970, 1, 1)).TotalSeconds);
			//Console.WriteLine (DateTime.UtcNow.Subtract (new DateTime (1970, 1, 1)).TotalSeconds);
			//Console.WriteLine (DateTime.UtcNow.Subtract (new DateTime (1970, 1, 1)).TotalSeconds);


		}
	}
}