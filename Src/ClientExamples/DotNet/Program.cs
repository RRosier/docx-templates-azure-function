using System;
using System.IO;
using System.Net;
using System.Text;
using System.Text.Json;

namespace DotNet
{
    class Person 
    {
        public string name { get; set; }
        public string email { get; set; }
    }

    class Program
    {
        static void Main(string[] args)
        {
            var url = "http://localhost:7071/api/docx";
            var templateFile = "../template.docx";

            Console.WriteLine($"template file: {templateFile}");

            // Create the multipart body
            byte[] CRLF = Encoding.ASCII.GetBytes("\r\n");
            byte[] boundary = Encoding.ASCII.GetBytes("multipartboundary_multipartboundary");
            byte[] hyphens = Encoding.ASCII.GetBytes("--");
            
            var request = WebRequest.CreateHttp(url);
            request.Method = "POST";
            request.ContentType = $"multipart/form-data; boundary={Encoding.ASCII.GetString(boundary)}";

            using (var buffer = new BinaryWriter(request.GetRequestStream(), Encoding.ASCII))
            {
                // write object
                buffer.Write(hyphens);
                buffer.Write(boundary);
                buffer.Write(CRLF);            
                buffer.Write(Encoding.ASCII.GetBytes("Content-Type: application/json"));
                buffer.Write(CRLF);
                buffer.Write(Encoding.ASCII.GetBytes("Content-Disposition: form-data"));
                buffer.Write(CRLF);                    
                buffer.Write(CRLF);

                var json = JsonSerializer.Serialize<Person>(new Person { name = "Adam Smith", email = "adam.smith@contoso.com"}, new JsonSerializerOptions { WriteIndented=true});
                buffer.Write(Encoding.ASCII.GetBytes(json));

                // write document
                buffer.Write(CRLF);
                buffer.Write(hyphens);
                buffer.Write(boundary);
                buffer.Write(CRLF);
                buffer.Write(Encoding.ASCII.GetBytes("Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
                buffer.Write(CRLF);
                buffer.Write(Encoding.ASCII.GetBytes("Content-Disposition: file; filename=\"mydocument.dotx\""));
                buffer.Write(CRLF);
                buffer.Write(CRLF);

                var bytes = System.IO.File.ReadAllBytes(templateFile);
                buffer.Write(bytes);

                // add closing boundary
                buffer.Write(CRLF);
                buffer.Write(hyphens);
                buffer.Write(boundary);
                buffer.Write(hyphens);
                buffer.Write(CRLF);
                buffer.Flush();
            }

            var response = request.GetResponse();
            Console.WriteLine($"Content-Type: {response.ContentType}");
            Console.WriteLine($"Content-Length: {response.ContentLength}");
            using (var s = response.GetResponseStream())
            using (var fs = new FileStream("myfile.docx", FileMode.OpenOrCreate))
            {
                s.CopyTo(fs);
            }
        }
    }
}
