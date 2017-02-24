using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Facephone.Processor
{
    class FacebookScanResult
    {
        public readonly bool HasPosts = false;
        public readonly string FacebookId = null;

        public FacebookScanResult(string facebookId, bool hasPosts = false)
        {
            FacebookId = facebookId;
            HasPosts = hasPosts;
            Validate();
        }

        private void Validate()
        {
            if (!string.IsNullOrEmpty(FacebookId) && HasPosts)
            {
                throw new ArgumentException("Facebook result cannot have single FacebookId result and other posts at the same time");
            }
        }
    }
}
