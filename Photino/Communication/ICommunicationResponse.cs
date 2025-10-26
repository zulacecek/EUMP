using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace HelloPhotino.Vue.Communication
{
    internal interface ICommunicationResponse
    {
        public LayerCommunicationResult Result { get; set; }
        public string Message { get; set; }

        public bool IsSuccess => Result == LayerCommunicationResult.OK;
    }
}
