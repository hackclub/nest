from typing import List
from typing import Type

from nephthys.transcripts.transcript import Transcript
from nephthys.transcripts.transcripts.nest import Nest


transcripts: List[Type[Transcript]] = [Nest]
