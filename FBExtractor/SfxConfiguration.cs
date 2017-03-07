using System;
using System.IO;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace FBExtractor
{
	class SfxConfiguration
	{
		string FilePath;
		JObject jObject;
        static object lockObj;

		public SfxConfiguration (string filePath)
		{
			FilePath = filePath;
			jObject = JObject.Parse (File.ReadAllText (filePath));
		}

		public void AddPost (string postId)
		{
			JObject postdata = jObject ["postdata"] as JObject;
			try {
				postdata.Add (postId, JToken.FromObject (new{ read_on = Timestamp ()}));
			} catch (ArgumentException ex) {
				FBExtractorMain.OnLog ($"\tPost {postId} already marked read");
			}
            lock(lockObj)
            {
			    File.WriteAllText (FilePath, jObject.ToString ());
            }
		}

		string Timestamp()
		{
			var result = ((long)DateTime.UtcNow.Subtract (new DateTime (1970, 1, 1, 0, 0, 0)).TotalSeconds * 1000).ToString ();
			return result;
		}
	}
}