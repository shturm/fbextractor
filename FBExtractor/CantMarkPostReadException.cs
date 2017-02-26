using System;
namespace FBExtractor
{
	public class CantMarkPostReadException : Exception
	{
		public CantMarkPostReadException (string msg) : base(msg)
		{
		}

		public CantMarkPostReadException (string msg, Exception inner) : base(msg, inner)
		{
		}
	}
}

