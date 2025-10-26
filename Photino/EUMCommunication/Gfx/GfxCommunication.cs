using EUM.Core.Context;
using EUM.Photino.Importers;
using HelloPhotino.Vue.Communication;
using Photino.NET;

namespace EUM.Photino.EUMCommunication.Gfx
{
    internal class GfxCommunication
    {
        internal async static Task<ICommunicationResponse> RenderVanillaIcons(ICommunicationRequest request, PhotinoWindow __)
        {
            var response = new BaseCommunicationResponse(LayerCommunicationResult.NOK, request.CallerName, request.RequestId);

            var mod = EditorContext.OpenedMod;
            if (mod is not null)
            {
                await IconsImporter.RenderVanillaMissionIcons(mod.Eu4Directory);
                await IconsImporter.WriteAvailableIconsFile();
                response.Result = LayerCommunicationResult.OK;
            }

            return response;
        }
    }
}
