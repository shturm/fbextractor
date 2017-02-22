using System.Collections.Generic;

namespace Facephone
{
	public class Phone
	{
		public readonly string PhoneNumber;
		public readonly string FacebookId;
		public readonly List<string> Links;

		public  Phone(string phone, string fbid, List<string> links)
		{
			PhoneNumber = phone;
			FacebookId = fbid;
			Links = links;
		}
	}
}