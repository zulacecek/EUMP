using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HelloPhotino.Vue.Communication
{
    internal interface ICommunicationRequest
    {
        public string CallerName { get; set; }
        public string Message { get; set; }
        public string RequestId { get; set; }
    }
}
