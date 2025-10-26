using Photino.NET;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HelloPhotino.Vue.Communication
{
    internal interface ILayerCommunication
    {
        void HandleMessageReceived(object? sender, string message);
        Task<ICommunicationResponse> ProcessCommunication(PhotinoWindow window, string message);
        void RegisterCommunicationHandler(string callerName, Func<ICommunicationRequest, PhotinoWindow, ICommunicationResponse> handler);
    }
}
