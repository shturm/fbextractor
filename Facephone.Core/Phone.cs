using System.Collections.Generic;

namespace Facephone.Core
{
	public class Phone
	{
		public readonly string PhoneNumber;
		public readonly string FacebookId;
		public readonly bool HasFacebookPosts;
        public readonly Dictionary<string,string> LinksAndHtml;

		public  Phone(string phone, string fbid, bool hasPosts, Dictionary<string, string> linksAndHtml)
		{
			PhoneNumber = phone;
			FacebookId = fbid;
			LinksAndHtml = linksAndHtml;
            HasFacebookPosts = hasPosts;
		}
	}
}