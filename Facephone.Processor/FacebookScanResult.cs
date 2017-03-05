using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Facephone.Processor
{
    class ScanFacebookResult
    {
        public readonly bool HasPosts = false;
        public readonly string FacebookId = null;
        public readonly string Html = null;

        public ScanFacebookResult(string facebookId, string html, bool hasPosts = false)
        {
            FacebookId = facebookId;
            HasPosts = hasPosts;
            Html = html;
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
