using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Facegroup;

namespace Facegroup.Tests
{
    [TestFixture]
    class SfxConfigurationTests
    {
        [Test]
        public void PostExistsTest()
        {
            var sfx = new SfxConfiguration("Facegroup.Tests/bin/Debug/sfx.json");
            Assert.True(sfx.PostExists("0123456789"));
            Assert.False(sfx.PostExists("non existing post id"));
        }
    }
}
