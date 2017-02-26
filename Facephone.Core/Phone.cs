using System.Collections.Generic;

namespace Facephone
{
	public class Phone
	{
		public readonly string PhoneNumber;
		public readonly string FacebookId;
		public readonly bool HasFacebookPosts;
        public readonly List<string> Links;

		public  Phone(string phone, string fbid, bool hasPosts, List<string> links)
		{
			PhoneNumber = phone;
			FacebookId = fbid;
			Links = links;
            HasFacebookPosts = hasPosts;
		}
	}
}