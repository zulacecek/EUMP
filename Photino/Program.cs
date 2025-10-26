using EUM.Core.Context;
using EUM.Photino.EUMCommunication.FileSystem;
using EUM.Photino.EUMCommunication.Gfx;
using EUM.Photino.EUMCommunication.Object;
using EUM.Photino.EUMCommunication.System;
using HelloPhotino.Vue.Communication;
using HelloPhotino.Vue.FileSystem;
using Photino.NET;
using Photino.NET.Server;

namespace HelloPhotino.Vue;
class Program
{
    public static bool IsDebugMode = true;

    [STAThread]
    static void Main(string[] args)
    {
        FileServer.StartFileServer();

        PhotinoServer
            .CreateStaticFileServer(args, out string baseUrl)
            .RunAsync();

        string appUrl = IsDebugMode ? "http://localhost:5173" : $"{baseUrl}/index.html";

        string windowTitle = "EUM";

        var window = new PhotinoWindow()
            .SetTitle(windowTitle)
            .SetMaximized(true)
            .Load(appUrl)
            .SetGrantBrowserPermissions(true)
            .SetBrowserControlInitParameters("--remote-debugging-port=9222");

        AfterLaunchInitialization(window);

        window.WaitForClose();
    }

    private static void AfterLaunchInitialization(PhotinoWindow window)
    {
        BaseFileSystemProvider.TryInitializeAppDocumentFolder();
        RegisterDefaultLayerCommunication(window);
        RegisterOnCloseAction(window);
    }

    private static void RegisterDefaultLayerCommunication(PhotinoWindow window)
    {
        var defaultCommunication = new BaseLayerCommunication();
        window.RegisterWebMessageReceivedHandler(defaultCommunication.HandleMessageReceived);
        RegisterLayerCommunications(defaultCommunication);
    }

    private static void RegisterOnCloseAction(PhotinoWindow window)
    {
        window.WindowClosing += (object sender, EventArgs e) =>
        {
            if (EditorContext.ForceClose)
            {
                return false;
            }

            SystemCommunication.ConfirmClose(window);
            return true;
        };
    }

    private static void RegisterLayerCommunications(BaseLayerCommunication defaultCommunication)
    {
        defaultCommunication.RegisterCommunicationHandler(nameof(FileSystemCommunication.ReadDir), FileSystemCommunication.ReadDir);
        defaultCommunication.RegisterCommunicationHandler(nameof(FileSystemCommunication.GetUserDocumentFolder), FileSystemCommunication.GetUserDocumentFolder);
        defaultCommunication.RegisterCommunicationHandler(nameof(FileSystemCommunication.DeleteFile), FileSystemCommunication.DeleteFile);
        defaultCommunication.RegisterCommunicationHandler(nameof(FileSystemCommunication.GetFileMetadata), FileSystemCommunication.GetFileMetadata);
        defaultCommunication.RegisterCommunicationHandler(nameof(ObjectCommunication.OpenMod), ObjectCommunication.OpenMod);
        defaultCommunication.RegisterCommunicationHandler(nameof(ObjectCommunication.OpenModSettings), ObjectCommunication.OpenModSettings);
        defaultCommunication.RegisterCommunicationHandler(nameof(ObjectCommunication.ExportMod), ObjectCommunication.ExportMod);
        defaultCommunication.RegisterCommunicationHandler(nameof(ObjectCommunication.OpenExternalEditor), ObjectCommunication.OpenExternalEditor);
        defaultCommunication.RegisterCommunicationHandler(nameof(SystemCommunication.CloseApp), SystemCommunication.CloseApp);
        defaultCommunication.RegisterCommunicationHandler(nameof(SystemCommunication.CheckAvailableEditors), SystemCommunication.CheckAvailableEditors);
        defaultCommunication.RegisterCommunicationHandler(nameof(SystemCommunication.OpenFolder), SystemCommunication.OpenFolder);
        
        defaultCommunication.RegisterAsyncCommunicationHandler(nameof(FileSystemCommunication.OpenFileDialogAsync), FileSystemCommunication.OpenFileDialogAsync);
        defaultCommunication.RegisterAsyncCommunicationHandler(nameof(GfxCommunication.RenderVanillaIcons), GfxCommunication.RenderVanillaIcons);
    }
}
