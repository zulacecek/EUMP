using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HelloPhotino.Vue.Communication
{
    internal class BaseCommunicationResponse(LayerCommunicationResult result, string callerName, string requestId) : ICommunicationResponse
    {
        public LayerCommunicationResult Result { get; set; } = result;
        private List<string> Errors { get; } = [];
        public string Message { get; set; } = string.Empty;
        public string CallerName { get; set; } = callerName;
        public string RequestId { get; set; } = requestId;

        public void AddError(string error)
        {
            Errors.Add(error);
        }

        public bool HasErrors => Errors.Count > 0;
    }
}
