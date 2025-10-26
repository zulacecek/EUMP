using EUM.Core.Serialization;
using EUM.Logging.Logging;
using Photino.NET;
using System.Text.Json;

namespace HelloPhotino.Vue.Communication
{
    internal class BaseLayerCommunication : ILayerCommunication
    {
        private readonly Dictionary<string, Func<ICommunicationRequest, PhotinoWindow, ICommunicationResponse>> _handlers = [];
        private readonly Dictionary<string, Func<ICommunicationRequest, PhotinoWindow, Task<ICommunicationResponse>>> _asyncHandlers = [];

        public async void HandleMessageReceived(object? sender, string message)
        {
            if (sender is not PhotinoWindow window || window == null)
            {
                LogProvider.LogText(LogItemType.Error, nameof(BaseLayerCommunication), "PhotinoWindow missing");
                return;
            }

            var response = await ProcessCommunication(window, message) as BaseCommunicationResponse;

            window.SendWebMessage(JsonSerializerExtender.Serialize(response));
        }

        public async Task<ICommunicationResponse> ProcessCommunication(PhotinoWindow window, string message)
        {
            var request = JsonSerializerExtender.Deserialize<BaseCommunicationRequest>(message);
            if (request is null)
            {
                var errorMessage = "Invalid communication request";
                LogProvider.LogText(LogItemType.Error, nameof(BaseLayerCommunication), errorMessage);
                return GetErrorResponse(errorMessage, "MissingCaller", "MissingId");
            }

            var isHandlerRegistered = _handlers.TryGetValue(request.CallerName, out var handler);
            if (!isHandlerRegistered)
            {
                var isAsyncHandlerRegistered = _asyncHandlers.TryGetValue(request.CallerName, out var asyncHandler);
                if (!isHandlerRegistered && !isAsyncHandlerRegistered)
                {
                    return GetErrorResponse("Unregistered communication method", request.CallerName, request.RequestId);
                }

                if (asyncHandler == null)
                {
                    return GetErrorResponse("Unregistered communication method", request.CallerName, request.RequestId);
                }

                return await asyncHandler.Invoke(request, window);
            }

            if (handler == null)
            {
                return GetErrorResponse("Unregistered communication method", request.CallerName, request.RequestId);
            }

            return handler.Invoke(request, window);
        }

        public void RegisterCommunicationHandler(string callerName, Func<ICommunicationRequest, PhotinoWindow, ICommunicationResponse> handler)
        {
            _handlers.Add(callerName, handler);
        }

        public void RegisterAsyncCommunicationHandler(string callerName, Func<ICommunicationRequest, PhotinoWindow, Task<ICommunicationResponse>> handler)
        {
            _asyncHandlers.Add(callerName, handler);
        }

        private BaseCommunicationResponse GetErrorResponse(string error, string callerName, string requestId)
        {
            var errorResponse = new BaseCommunicationResponse(LayerCommunicationResult.NOK, callerName, requestId);
            errorResponse.AddError(error);
            return errorResponse;
        }
    }
}
