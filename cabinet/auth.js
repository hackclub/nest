import ffi from "ffi";
import StructType from "ref-struct";
import ref from "ref";

var current = ffi.Library(null, {
  getsockopt: ["int", ["int", "int", "int", "pointer", "pointer"]],
  ntohs: ["uint16", ["uint16"]],
  //    const char *inet_ntop(int af, const void *src, char *dst, socklen_t size);
});

var SOL_IP = 0;
var SO_ORIGINAL_DST = 80;
var AF_INET = 2;

var sockaddr_in = StructType([
  ["int16", "sin_family"],
  ["uint16", "sin_port"],
  ["uint32", "sin_addr"],
  ["uint32", "trash1"],
  ["uint32", "trash2"],
]);

function get_original_dst(client) {
  var dst = new sockaddr_in();
  var dstlen = ref.alloc(ref.types.int, sockaddr_in.size);
  var r = current.getsockopt(
    client._handle.fd,
    SOL_IP,
    SO_ORIGINAL_DST,
    dst.ref(),
    dstlen,
  );
  if (r === -1) throw new Error("getsockopt(SO_ORIGINAL_DST) error");
  if (dst.sin_family !== AF_INET)
    throw new Error(
      "getsockopt(SO_ORIGINAL_DST) returns unknown family: " + dst.sin_family,
    );

  // TODO: inet_ntop. inet_ntoa is _UNSAFE_
  var ipaddr = dst.ref();
  ipaddr = ipaddr[4] + "." + ipaddr[5] + "." + ipaddr[6] + "." + ipaddr[7];

  return [ipaddr, current.ntohs(dst.sin_port)];
}

export { get_original_dst };
