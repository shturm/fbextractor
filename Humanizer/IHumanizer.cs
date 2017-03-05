using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Humanizer
{
    interface IHumanizer
    {
        void StayOnPage();
        void ScrollPage();
        void VisitRandomLink(); 
        void WaitRandom();
    }
}
