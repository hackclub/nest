from typing import List
from typing import Type

from nephthys.transcripts.transcript import Transcript
from nephthys.transcripts.transcripts.identity import Identity
from nephthys.transcripts.transcripts.summer_of_making import SummerOfMaking


transcripts: List[Type[Transcript]] = [Identity, SummerOfMaking]
