using System;
namespace FBExtractor
{
	public class CantSubscribeToPostException : Exception
	{
		public CantSubscribeToPostException ()
		{
		}

		public CantSubscribeToPostException (string msg) : base (msg)
		{
		}

		public CantSubscribeToPostException (string msg, Exception inner) : base (msg, inner)
		{
		}
	}
}

