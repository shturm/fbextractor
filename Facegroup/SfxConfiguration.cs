using System;
using System.IO;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using NLog;

namespace Facegroup
{
	class SfxConfiguration
	{
        private static ILogger _logger = LogManager.GetCurrentClassLogger();

        string FilePath;
		JObject jObject;

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
                _logger.Debug ($"\tPost {postId} already marked read");
			}
			File.WriteAllText (FilePath, jObject.ToString ());
		}

        public bool PostExists(string postId)
        {
            JObject postdata = jObject["postdata"] as JObject;
            try
            {
                var token = postdata.SelectToken(postId);
                if (token != null)
                {
                    return true;
                }
                return false;
            }
            catch (JsonException ex)
            {
                return false;
            }
        }

		string Timestamp()
		{
			var result = ((long)DateTime.UtcNow.Subtract (new DateTime (1970, 1, 1, 0, 0, 0)).TotalSeconds * 1000).ToString ();
			return result;
		}
	}
}