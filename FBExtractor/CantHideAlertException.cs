using System;
using System.Runtime.Serialization;

namespace FBExtractor
{
	[Serializable]
	class CantHideAlertException : Exception
	{
		public CantHideAlertException ()
		{
		}

		public CantHideAlertException (string message) : base (message)
		{
		}

		public CantHideAlertException (string message, Exception innerException) : base (message, innerException)
		{
		}

		protected CantHideAlertException (SerializationInfo info, StreamingContext context) : base (info, context)
		{
		}
	}
}