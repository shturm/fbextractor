using Facephone;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Facephone.Processor.Tests
{
    [TestFixture]
    public class QueueProcessorTests
    {
        [Test]
        public void BreakdownPhoneNumberTest()
        {
            var sut = new QueueProcessor();
            string phoneNumber = "0888123456";
            List<string> expected = new List<string>()
            {
                "0888 123 456",
                "0888 12 34 56",
                "088 812 3456",
                "0888123456"
            };

            List<string> actual = sut.Breakdown(phoneNumber);
            CollectionAssert.AreEquivalent(expected, actual);
        }

        [Test]
        public void BreakdownPhoneNumber_RealCaseTest()
        {
            var sut = new QueueProcessor();
            string phoneNumber = "0887059096";
            List<string> expected = new List<string>()
            {
                "0887 059 096",
                "0887 05 90 96",
                "088 705 9096",
                "0887059096"
            };

            List<string> actual = sut.Breakdown(phoneNumber);
            CollectionAssert.AreEquivalent(expected, actual);
        }


        [Test]
        [TestCase("+359899123456")]
        [TestCase("359899123456")]
        [TestCase("899123456")]
        [TestCase("0899 123 456")]
        [TestCase("0899 12 34 56")]
        [TestCase("0899-123-456")]
        public void BreakdownPhoneNumber_InvalidInput_Throws(string phoneNumber)
        {
            var sut = new QueueProcessor();
            Assert.Throws<ArgumentException>(() =>
            {
                sut.Breakdown(phoneNumber);
            });
        }

        [Test]
        [TestCase("‎0887059096")]
        public void BreakdownPhoneNumber_ValidInput_DoesNotThrows(string phoneNumber)
        {
            var sut = new QueueProcessor();
            Assert.DoesNotThrow(() =>
            {
                sut.Breakdown(phoneNumber);
            });
        }

    }
}
