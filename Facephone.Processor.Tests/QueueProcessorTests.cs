using Facephone;
using Humanizer;
using Moq;
using NLog;
using NUnit.Framework;
using OpenQA.Selenium;
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
            var driverMock = new Mock<IWebDriver>();
            var loggerMock = new Mock<ILogger>();
            var humanizer = new Humanizer.Humanizer(driverMock.Object);

            var sut = new QueueProcessor(driverMock.Object, humanizer);
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
            var driverMock = new Mock<IWebDriver>();
            var loggerMock = new Mock<ILogger>();
            var humanizer = new Humanizer.Humanizer(driverMock.Object);

            var sut = new QueueProcessor(driverMock.Object, humanizer);
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
            var driverMock = new Mock<IWebDriver>();
            var loggerMock = new Mock<ILogger>();
            var humanizer = new Humanizer.Humanizer(driverMock.Object);

            var sut = new QueueProcessor(driverMock.Object, humanizer);
            Assert.Throws<ArgumentException>(() =>
            {
                sut.Breakdown(phoneNumber);
            });
        }

        [Test]
        [TestCase("‎0887059096")]
        public void BreakdownPhoneNumber_ValidInput_DoesNotThrows(string phoneNumber)
        {
            var driverMock = new Mock<IWebDriver>();
            var loggerMock = new Mock<ILogger>();
            var humanizer = new Humanizer.Humanizer(driverMock.Object);

            var sut = new QueueProcessor(driverMock.Object, humanizer);
            Assert.DoesNotThrow(() =>
            {
                sut.Breakdown(phoneNumber);
            });
        }

    }
}
