using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace HelloPhotino.Vue.Communication
{
    internal class BaseCommunicationRequest : ICommunicationRequest
    {
        public string CallerName { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string RequestId { get; set; } = string.Empty;
    }
}
