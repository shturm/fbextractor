using System;
namespace FBExtractor
{
	public class WrongDataPageException : Exception
	{
		public WrongDataPageException () 
		{
		}

		public WrongDataPageException (string msg): base(msg)
		{

		}

		public WrongDataPageException (string msg, Exception inner): base(msg,inner)
		{

		}
	}
}

