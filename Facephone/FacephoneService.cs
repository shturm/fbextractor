using System;
using Newtonsoft.Json;
using System.Configuration;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Data.SQLite;

namespace Facephone
{
	public class FacephoneService
	{
		public FacephoneService ()
		{

		}

		public Phone GetOrEnque (string phone)
		{
			phone = phone.Replace (" ", "")
						 .Replace ("(", "")
						 .Replace (")", "")
						 .Replace ("+", "")
						 .Replace ("-", "");
            Validate(phone);
			Phone p = GetPhone (phone);
			if (p == null) {
				Enque (phone);
			}

			return p;
		}



        void Enque(string phoneNumber)
        {
            bool alreadyEnqued = false;
            string cs = ConfigurationManager.AppSettings["ConnectionString"];
            using (var con = new SQLiteConnection(cs))
            {
                con.Open();
                using (var tr = con.BeginTransaction())
                {
                    using (var cmd = con.CreateCommand())
                    {
                        cmd.Transaction = tr;
                        cmd.CommandText = $"SELECT COUNT(*) FROM Queue WHERE PhoneNumber = '{phoneNumber}'";
                        int count = int.Parse(cmd.ExecuteScalar().ToString());
                        alreadyEnqued = count > 0 ? true : false;
                    }

                    if (!alreadyEnqued)
                    {
                        using (var cmd2 = con.CreateCommand())
                        {
                            cmd2.Transaction = tr;
                            cmd2.CommandText = $"INSERT INTO Queue (PhoneNumber) VALUES ('{phoneNumber}')";
                            cmd2.ExecuteNonQuery();
                        }
                    }

                    tr.Commit();
                }
            }
        }

		Phone GetPhone (string phoneNumber)
		{
            string phoneId = null;
            string facebookId = null;
            bool hasFacebookPosts = false;
            List<string> links = new List<string>();

            string cs = ConfigurationManager.AppSettings["ConnectionString"];
            using (var con = new SQLiteConnection(cs))
            {
                con.Open();


                using (var tr = con.BeginTransaction())
                {
                    using (var cmd = con.CreateCommand())
                    {
                        cmd.Transaction = tr;
                        cmd.CommandText = $"SELECT * FROM Phones where PhoneNumber = '{phoneNumber}' limit 1";
                        using (var reader = cmd.ExecuteReader())
                        {
                            if(reader.Read())
                            {
                                phoneId = reader["Id"].ToString();
                                facebookId = reader["FacebookId"].ToString();
                                hasFacebookPosts = reader["HasFacebookPosts"].ToString() == "1" ? true : false;
                            } else
                            {
                                return null;
                            }
                        }
                    }

                    using (var cmd2 = con.CreateCommand())
                    {
                        cmd2.Transaction = tr;
                        cmd2.CommandText = $"SELECT Url FROM Links where PhoneId = '{phoneId}'";
                        using (var reader = cmd2.ExecuteReader())
                        {
                            while(reader.Read())
                            {
                                links.Add(reader["Url"].ToString());
                            }
                        }
                    }

                    tr.Commit();
                }
            }

            return new Phone(phoneNumber, facebookId, hasFacebookPosts, links);
        }

        private void Validate(string phone)
        {
            if (!Regex.IsMatch(phone, @"^0\d{9}$"))
            {
                throw new ArgumentException($"{phone} is not a valid phone number");
            }
        }
    }
}

